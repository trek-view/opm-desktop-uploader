import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import {
  selStartTime,
  selGPXStartTime,
  setCurrentStep,
  selPoints,
  selGPXPoints,
  setSequencePoints,
  selFirstMatchedPoints,
} from './slice';
import { importGpx } from '../scripts/utils';

export default function SequenceStartTime() {
  const dispatch = useDispatch();
  const startTime = useSelector(selStartTime);
  const gpxStartTime = useSelector(selGPXStartTime);
  const points = useSelector(selPoints);
  const gpxPoints = useSelector(selGPXPoints);
  const firstMatchedPoints = useSelector(selFirstMatchedPoints);

  const modifyTime = () => {
    dispatch(setCurrentStep('modifyTime'));
  };

  const correctTime = () => {
    const newpoints = importGpx(points, gpxPoints);
    dispatch(setSequencePoints(newpoints));
    dispatch(setCurrentStep('modifySpace'));
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" align="center" color="textSecondary">
          Confirm GPX Track
        </Typography>
        <Typography paragraph>
          This process will overwrite any existing geotags. Any photos that do
          not match exactly to GPX track will be discarded.
        </Typography>
        <Typography paragraph>
          {`The start time of your GPS Track is: ${gpxStartTime}`}
        </Typography>
        <Typography paragraph>
          {`The time in the first photo in the sequence is: ${startTime}`}
        </Typography>
        {firstMatchedPoints && (
          <Typography paragraph>
            {`We found the first matching gps record in the track for this photo
            at lat=${firstMatchedPoints.latitude} lon=${firstMatchedPoints.longitude} alt=${firstMatchedPoints.elevation} at FIRST MATCH TIME.`}
          </Typography>
        )}
        {!firstMatchedPoints && (
          <Typography paragraph>
            There are no matched points between Photos and Gpx Points. Maybe you
            have to change the start time of Gpx points.
          </Typography>
        )}
      </Grid>
      <Grid item xs={12}>
        <Box mr={1} display="inline-block">
          <Button
            endIcon={<ChevronRightIcon />}
            color="secondary"
            onClick={modifyTime}
            variant="contained"
          >
            Modify Photo Times
          </Button>
        </Box>
        <Button
          endIcon={<ChevronRightIcon />}
          color="primary"
          onClick={correctTime}
          variant="contained"
        >
          Geotag Images
        </Button>
      </Grid>
    </>
  );
}
