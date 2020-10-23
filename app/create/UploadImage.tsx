import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Typography from '@material-ui/core/Typography';
import { Grid, FormControlLabel, Checkbox } from '@material-ui/core';
import Button from '@material-ui/core/Button';

import { OpenDialogSyncOptions } from 'electron';

import CloudUploadIcon from '@material-ui/icons/CloudUpload';

import {
  setSequenceImagePath,
  selSequenceAttachType,
  selSequenceName,
  setMultiPartProcessingMode,
} from './slice';

import fs from 'fs';

const { ipcRenderer, remote } = window.require('electron');

export default function SequenceUploadImage() {
  const dispatch = useDispatch();
  const attachType = useSelector(selSequenceAttachType);
  const seqName = useSelector(selSequenceName);

  const [corrupted, setCorrupted] = useState<boolean>(false);

  const openFileDialog = async () => {
    const parentWindow = remote.getCurrentWindow();
    let options: OpenDialogSyncOptions;
    let channelName: string;
    if (attachType === 'video') {
      channelName = 'load_video';
      options = {
        properties: ['openFile'],
        filters: [
          {
            name: 'Video',
            extensions: ['mp4'],
          },
        ],
      };
    } else {
      channelName = 'load_images';
      options = {
        properties: ['openDirectory'],
      };
    }
    const result = remote.dialog.showOpenDialogSync(
      parentWindow,
      options
    );

    if (result) {
      const dirPath = result[0];

      let fileNames = fs
        .readdirSync(dirPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);

      fileNames = fileNames.filter((file: string) => {
        return file.toLowerCase().endsWith('.png') ||
          file.toLowerCase().endsWith('.jpeg') ||
          file.toLowerCase().endsWith('.jpg')
      });

      const imageLength = fileNames.length;

      if (imageLength > 10) {
        dispatch(setMultiPartProcessingMode(true));
      } else {
        dispatch(setMultiPartProcessingMode(false));
      }

      ipcRenderer.send(channelName, dirPath, seqName, corrupted);
      dispatch(setSequenceImagePath(dirPath));
    }
  };

  const openFileDialog2 = async () => {
    const parentWindow = remote.getCurrentWindow();
    let options: OpenDialogSyncOptions;
    let channelName: string;
    if (attachType === 'video') {
      channelName = 'load_video';
      options = {
        properties: ['openFile'],
        filters: [
          {
            name: 'Video',
            extensions: ['mp4'],
          },
        ],
      };
    } else {
      channelName = 'load_image_files';
      options = {
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: 'Image',
            extensions: ['jpg', 'jpeg', 'png'],
          },
        ],
      };
    }
    const result = remote.dialog.showOpenDialogSync(
      parentWindow,
      options
    );

    if (result) {
      if (channelName === 'load_image_files') {
        const path = require('path').dirname(result[0]);
        let fileNames = result;
        for (var i = 0; i < fileNames.length; i++) {
          fileNames[i] = fileNames[i].replace(/^.*[\\\/]/, '');
        }

        if (fileNames.length > 500) {
          dispatch(setMultiPartProcessingMode(true));
        } else {
          dispatch(setMultiPartProcessingMode(false));
        }

        ipcRenderer.send(channelName, path, fileNames, seqName, corrupted);
        dispatch(setSequenceImagePath(path));
      } else {
        ipcRenderer.send(channelName, result[0], seqName, corrupted);
        dispatch(setSequenceImagePath(result[0]));
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCorrupted(event.target.checked);
  };

  const corrupedCheck = (
    <Checkbox
      checked={corrupted}
      onChange={handleChange}
      name="checkedB"
      color="primary"
    />
  );
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" align="center" color="textSecondary">
          {`Please upload the ${attachType === 'video' ? attachType : 'timelapse photos'
            }`}
        </Typography>

        <FormControlLabel
          color="primary"
          control={corrupedCheck}
          label="Check for corrupted (black) images (only recommended you tick this box if you suspect the file(s) contain black and/or visually corrupted frames)"
        />
      </Grid>
      {attachType === 'video' ? null :
        <Grid item xs={12}>
          <Button
            onClick={openFileDialog}
            color="primary"
            endIcon={<CloudUploadIcon />}
            variant="contained"
          >
            Select Image Folder
        </Button>
        </Grid>}
      <Grid item xs={12}>
        {attachType === 'video' ? <Button
          onClick={openFileDialog2}
          color="primary"
          endIcon={<CloudUploadIcon />}
          variant="contained"
        >
          Select Video File
        </Button> :
          <Button
            onClick={openFileDialog2}
            color="primary"
            endIcon={<CloudUploadIcon />}
            variant="contained"
          >
            Select Image Files
        </Button>}
      </Grid>
      <Grid item xs={12} />
    </>
  );
}
