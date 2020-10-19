import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Grid, Button, Box, Typography, Container, FormGroup, Checkbox, FormControlLabel } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import Map from '../components/Map';

import { setCurrentStep, selPoints } from './slice';

import fs from 'fs';
import path from 'path';
const electron = require('electron');

const useStyles = makeStyles((theme) => ({
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    '& > *': {
      margin: theme.spacing(2),
    },
  },
  buttonWrapper: {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
}));

export default function RequireModify() {
  const dispatch = useDispatch();

  const points = useSelector(selPoints);

  const classes = useStyles();

  const [state, setState] = React.useState({
    modify_gps_spacing: false,
    remove_outlier: false,
    modify_heading: false,
    add_copyright: false,
    add_nadir: false,
  });

  const handleChange = (event: { target: { name: any; checked: any; }; }) => {
    const updateArr = { ...state, [event.target.name]: event.target.checked };
    setState(updateArr);
    fs.writeFileSync(path.join(path.join((electron.app || electron.remote.app).getAppPath(), '../'), 'settings.json'), 
    JSON.stringify({
        'modify_gps_spacing': updateArr.modify_gps_spacing,
        'remove_outlier': updateArr.remove_outlier,
        'modify_heading': updateArr.modify_heading,
        'add_copyright': updateArr.add_copyright,
        'add_nadir': updateArr.add_nadir,
      })
    )};

  // const confirmMode = () => {
  //   dispatch(setCurrentStep('destination'));
  // };

  const requireModify = () => {
    fs.readFile(path.join(path.join((electron.app || electron.remote.app).getAppPath(), '../'), 'settings.json'), 'utf8', (error, data) => {
      if (error) {
        console.log(error);
        dispatch(setCurrentStep('modifySpace'));
        return;
      }
      console.log(data);
      var settings = JSON.parse(data);
      if (settings.modify_gps_spacing === true) {
        dispatch(setCurrentStep('modifySpace'));
      } else if (settings.remove_outlier === true) {
        dispatch(setCurrentStep('outlier'));
      } else if (settings.modify_heading === true) {
        dispatch(setCurrentStep('azimuth'));
      } else if (settings.add_copyright === true) {
        dispatch(setCurrentStep('copyright'));
      } else if (settings.add_nadir === true) {
        dispatch(setCurrentStep('nadir'));
      } else {
        dispatch(setCurrentStep('destination'));
      }
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" align="center" color="textSecondary">
          Your temporary sequence
        </Typography>
        <Typography paragraph>
          Here's what your sequence looks like. You can make changes to the GPS
          positioning or add a nadir by clicking Advance settings. Alternatively
          you can skip all these steps if you're ready to upload.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Map points={points} />
      </Grid>
      <Grid item xs={12}>
        <Box>
          <Typography paragraph>
            Please tick upload settings to be changed:
          </Typography>
          <Container maxWidth="sm">
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={state.modify_gps_spacing} onChange={handleChange} name="modify_gps_spacing" color="primary" />} label="Modify GPS Spacing" />
            </FormGroup>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={state.remove_outlier} onChange={handleChange} name="remove_outlier" color="primary" />} label="Remove Outlier" />
            </FormGroup>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={state.modify_heading} onChange={handleChange} name="modify_heading" color="primary" />} label="Modify Heading" />
            </FormGroup>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={state.add_copyright} onChange={handleChange} name="add_copyright" color="primary" />} label="Add Copyright" />
            </FormGroup>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={state.add_nadir} onChange={handleChange} name="add_nadir" color="primary" />} label="Add Nadir" />
            </FormGroup>
          </Container>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Box className={classes.buttonWrapper}>
          <Button
            endIcon={<ChevronRightIcon />}
            color="secondary"
            onClick={requireModify}
            variant="contained"
          >
            Advanced settings
          </Button>
        </Box>
      </Grid>
    </>
  );
}
