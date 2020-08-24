import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import dayjs from 'dayjs';

import { IGeoPoint, IGeoPointModel } from '../../types/IGeoPoint';
import { Result, Summary } from '../../types/Result';

export const resultdirectory = 'sequences';

export const tempLogo = 'output.png';

export function sendToClient(
  win: BrowserWindow | null,
  channelname: string,
  ...args: any[]
) {
  // eslint-disable-next-line global-require
  if (win) win.webContents.send(channelname, ...args);
}

export function sendPoints(win: BrowserWindow | null, points: IGeoPoint[]) {
  sendToClient(
    win,
    'loaded_points',
    points.map((item: IGeoPoint) => {
      item.convertDateToStr();
      return item;
    })
  );
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function getDistance(point1: any, point2: any) {
  if (!point1 || !point2) {
    return 0;
  }
  const lat2 = point2.MAPLatitude;
  const lon2 = point2.MAPLongitude;
  const lat1 = point1.MAPLatitude;
  const lon1 = point1.MAPLongitude;
  const R = 6371 * 1000; // Radius of the earth in meter
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

export function createdData2List(data: Result): Summary {
  const { sequence, photo } = data;
  return {
    id: sequence.id,
    tags: sequence.uploader_tags,
    name: sequence.uploader_sequence_name,
    description: sequence.uploader_sequence_description,
    type: sequence.uploader_transport_type,
    method: sequence.uploader_transport_method,
    points: Object.values(photo),
    total_km: sequence.distance_km,
    created: sequence.created,
    captured: sequence.earliest_time,
    camera: sequence.uploader_camera,
  };
}

export function getBearing(point1: IGeoPoint, point2: IGeoPoint) {
  const lng1 = point1.MAPLongitude;
  const lat1 = point1.MAPLatitude;
  const lng2 = point2.MAPLongitude;
  const lat2 = point2.MAPLatitude;

  const dLon = lng2 - lng1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return brng;
}

export function getPitch(point1: IGeoPoint, point2: IGeoPoint, distance = -1) {
  const dis = distance !== -1 ? distance : point1.Distance;
  return dis !== 0 ? (point2.MAPAltitude - point1.MAPAltitude) / dis : 0;
}

export function getSequenceBasePath(seqname: string): string {
  const directoryname = seqname.toLowerCase().replace(/\s/g, '_');
  return path.resolve(resultdirectory, directoryname);
}

export function getOriginalBasePath(seqname: string): string {
  return path.resolve(getSequenceBasePath(seqname), 'originals');
}

export function getSequenceImagePath(
  seqname: string,
  filename: string
): string {
  return path.resolve(getOriginalBasePath(seqname), filename);
}

export enum OutputType {
  raw = 'final_raw',
  nadir = 'final_nadir',
  blur = 'final_blurred',
}

export function getSequenceOutputPath(
  seqname: string,
  filename: string,
  type: OutputType
): string {
  return path.resolve(getSequenceBasePath(seqname), type, filename);
}

export function getSequenceLogPath(seqname: string): string {
  const logofile = seqname.toLowerCase().replace(/\s/g, '_');
  return path.join(getSequenceBasePath(seqname), `${logofile}.json`);
}

export function getSequenceGpxPath(seqname: string): string {
  const logofile = seqname.toLowerCase().replace(/\s/g, '_');
  return path.join(getSequenceBasePath(seqname), `${logofile}.gpx`);
}

export function discardPointsBySeconds(
  points: IGeoPoint[],
  seconds: number,
  forceUpdate = false
): IGeoPoint[] {
  const newpoints = [];
  let nextIdx = 1;
  let currentIdx = 0;

  while (true) {
    const point = points[currentIdx];

    if (nextIdx >= points.length) {
      point.setDistance(0);

      const prevPoint = newpoints[newpoints.length - 1];

      if (!point.Azimuth && prevPoint.Azimuth) {
        point.setAzimuth(prevPoint.Azimuth);
      }

      if (!point.Pitch && prevPoint.Pitch) {
        point.setPitch(prevPoint.Pitch);
      }
      newpoints.push(point);

      break;
    }

    const nextPoint = points[nextIdx];

    if (
      nextPoint.getDate().diff(point.getDate(), 'millisecond') >=
      seconds * 1000
    ) {
      let azimuth = point.Azimuth;
      if (!azimuth || forceUpdate) {
        azimuth = getBearing(point, nextPoint);
        point.setAzimuth(azimuth);
      }

      const distance = getDistance(nextPoint, point);
      point.setDistance(distance);

      let pitch = point.Pitch;
      if (!pitch || forceUpdate) {
        pitch = getPitch(point, nextPoint, distance);
        point.setPitch(pitch);
      }
      newpoints.push(point);

      currentIdx = nextIdx;
    }
    nextIdx += 1;
  }

  return newpoints;
}

export const errorHandler = (mainWindow: BrowserWindow | null, err: any) => {
  sendToClient(mainWindow, 'error', err.message || err);
};

export const removeDirectory = async (directoryPath: string) => {
  if (fs.existsSync(directoryPath)) {
    await rimraf.sync(directoryPath);
  }
  return true;
};

export const removeTempFiles = async (sequence: any) => {
  Object.keys(sequence.steps.previewnadir.items).forEach((f: string) => {
    if (fs.existsSync(sequence.steps.previewnadir.items[f])) {
      fs.unlinkSync(sequence.steps.previewnadir.items[f]);
    }
  });

  if (fs.existsSync(sequence.steps.previewnadir.logofile)) {
    fs.unlinkSync(sequence.steps.previewnadir.logofile);
  }
  return true;
};

export const resetSequence = async (sequence: any) => {
  await Promise.all([
    removeDirectory(getSequenceBasePath(sequence.steps.name)),
    removeTempFiles(sequence),
  ]);
};

export const importGpx = (
  proppoints: IGeoPointModel[],
  oldGpxPoints: any[],
  modifyTime = 0
) => {
  const points = proppoints.map((p: IGeoPointModel) => new IGeoPoint({ ...p }));
  const gpxPoints = oldGpxPoints.map((point: any) => {
    return {
      ...point,
      timestamp: dayjs(point.GPSDateTime).add(modifyTime, 'second'),
    };
  });
  let newPoints = points
    .map((point: IGeoPoint) => {
      const pointTime = dayjs(point.GPSDateTime);
      const matchedPoint = gpxPoints.filter(
        (p) => pointTime.diff(dayjs(p.timestamp), 'second') === 0
      );
      if (matchedPoint.length) {
        return new IGeoPoint({
          ...point,
          MAPLongitude: matchedPoint[0].longitude,
          MAPLatitude: matchedPoint[0].latitude,
          MAPAltitude: matchedPoint[0].elevation
            ? matchedPoint[0].elevation
            : point.MAPAltitude,
        });
      }
      return point;
    })
    .filter(
      (point: IGeoPoint) =>
        typeof point.MAPAltitude === 'undefined' ||
        typeof point.MAPLatitude === 'undefined' ||
        typeof point.MAPLongitude === 'undefined'
    );
  newPoints = discardPointsBySeconds(points, 1, true);
  return newPoints;
};
