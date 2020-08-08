import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';

import { push } from 'connected-react-router';

import Drawer from '@material-ui/core/Drawer';
import { Create as CreateIcon, List as ListIcon } from '@material-ui/icons';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { Alert, AlertTitle } from '@material-ui/lab';

import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import IconButton from '@material-ui/core/IconButton';

import { IpcRendererEvent } from 'electron';

import Name from './Name';
import Description from './Description';
import Type from './Type';
import Camera from './Camera';
import Method from './Method';
import AttachType from './AttachType';
import UploadImage from './UploadImage';
import UploadGpx from './UploadGpx';
import StartTime from './StartTime';
import ModifyTime from './ModifyTime';
import ModifySpace from './ModifySpace';
import ModifyOutlier from './ModifyOutlier';
import ModifyAzimuth from './ModifyAzimuth';
import Tags from './Tags';
import Nadir from './Nadir';
import UploadNadir from './UploadNadir';
import PreviewNadir from './PreviewNadir';
import ProcessPage from './ProcessPage';

import routes from '../constants/routes.json';
import {
  selPrevStep,
  selCurrentStep,
  goToPrevStep,
  setSequencePoints,
  setSequenceStartTime,
  setSequenceGpxPoints,
  setSequenceInit,
  setSequenceError,
  selError,
} from './slice';

import { setConfigLoadEnd } from '../base/slice';

import { setAddSeq } from '../list/slice';
import Logo from '../components/Logo';
import Wrapper from '../components/Wrapper';

const { ipcRenderer } = window.require('electron');

const drawerWidth = 300;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },

  drawerPaper: {
    width: drawerWidth,
  },

  gridContainer: {
    '& > *': {
      marginBottom: theme.spacing(2),
    },
  },
}));

export default function CreatePageWrapper() {
  const classes = useStyles();
  const prevStep = useSelector(selPrevStep);
  const currentStep = useSelector(selCurrentStep);
  const error = useSelector(selError);
  const dispatch = useDispatch();

  const goPrevStep = () => {
    dispatch(goToPrevStep());
  };

  useEffect(() => {
    ipcRenderer.on('loaded_points', (_event: IpcRendererEvent, points) => {
      dispatch(setSequencePoints(points));
    });

    ipcRenderer.on('start_time', (_event: IpcRendererEvent, starttime) => {
      dispatch(setSequenceStartTime(starttime));
    });

    ipcRenderer.on('add-seq', (_event: IpcRendererEvent, seq) => {
      dispatch(setAddSeq(seq));
      dispatch(setSequenceInit());
      dispatch(push(routes.LIST));
    });

    ipcRenderer.on('loaded_gpx', (_event: IpcRendererEvent, points) => {
      dispatch(setSequenceGpxPoints(points));
    });

    ipcRenderer.on('error', (_event: IpcRendererEvent, err) => {
      dispatch(setSequenceError(err));
    });

    ipcRenderer.on('loaded_config', (_event: IpcRendererEvent, config: any) => {
      dispatch(setConfigLoadEnd(config));
    });

    return () => {
      ipcRenderer.removeAllListeners('start_time');
      ipcRenderer.removeAllListeners('loaded_points');
      ipcRenderer.removeAllListeners('loaded_gpx');
      ipcRenderer.removeAllListeners('add-seq');
      ipcRenderer.removeAllListeners('error');
      ipcRenderer.removeAllListeners('loaded_cameras');
    };
  });

  return (
    <div>
      <Drawer
        open
        variant="persistent"
        anchor="left"
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Logo />
        <List>
          <ListItem
            button
            component="a"
            onClick={() => {
              dispatch(push(routes.CREATE));
            }}
          >
            <ListItemIcon>
              <CreateIcon />
            </ListItemIcon>
            <ListItemText>Create Sequence</ListItemText>
          </ListItem>
          <ListItem
            button
            component="a"
            onClick={() => {
              dispatch(push(routes.LIST));
            }}
          >
            <ListItemIcon>
              <ListIcon />
            </ListItemIcon>
            <ListItemText>My Sequences</ListItemText>
          </ListItem>
        </List>
      </Drawer>
      <Wrapper title="Create Sequence">
        <Grid
          container
          alignItems="center"
          style={{
            paddingTop: '30px',
            paddingBottom: '30px',
          }}
          className={classes.gridContainer}
        >
          {prevStep !== '' && (
            <Box position="absolute" top={20} left={20} zIndex="modal">
              <IconButton onClick={goPrevStep}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          )}

          {error && (
            <Grid xs={12}>
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                <span>{error}</span>
              </Alert>
            </Grid>
          )}

          {currentStep === 'name' && <Name />}
          {currentStep === 'description' && <Description />}
          {currentStep === 'type' && <Type />}
          {currentStep === 'method' && <Method />}
          {currentStep === 'camera' && <Camera />}
          {currentStep === 'attachType' && <AttachType />}
          {currentStep === 'imagePath' && <UploadImage />}
          {currentStep === 'gpx' && <UploadGpx />}
          {currentStep === 'startTime' && <StartTime />}
          {currentStep === 'modifyTime' && <ModifyTime />}
          {currentStep === 'modifySpace' && <ModifySpace />}
          {currentStep === 'outlier' && <ModifyOutlier />}
          {currentStep === 'azimuth' && <ModifyAzimuth />}
          {currentStep === 'tags' && <Tags />}
          {currentStep === 'nadir' && <Nadir />}
          {currentStep === 'nadirPath' && <UploadNadir />}
          {currentStep === 'previewNadir' && <PreviewNadir />}
          {currentStep === 'processPage' && <ProcessPage />}
        </Grid>
      </Wrapper>
    </div>
  );
}