import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './handler';

/**
 * Initialization data for the cscienv_nbgrader_extras extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cscienv_nbgrader_extras:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension cscienv_nbgrader_extras is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('cscienv_nbgrader_extras settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for cscienv_nbgrader_extras.', reason);
        });
    }

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The cscienv_nbgrader_extras server extension appears to be missing.\n${reason}`
        );
      });


    const { commands } = app;
    commands.addCommand('cscienv_nbgrader_extras:extract-student-grades', {
      label: 'Extract Student Grades',
      caption: 'Extract Student Grades',
      execute: () => {
        console.log('extract');
      }
    });
  }
};

export default plugin;
