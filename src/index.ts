import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Menu } from '@lumino/widgets';

import { requestAPI } from './handler';


const cmdExportGrades = 'cscienv_nbgrader_extras:extract-student-grades';
const cmdInitializeNbgrader = 'cscienv_nbgrader_extras:initialize-nbgrader';

/**
 * Initialization data for the cscienv_nbgrader_extras extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cscienv_nbgrader_extras:plugin',
  autoStart: true,
  requires: [IMainMenu],
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, mainMenu: IMainMenu, settingRegistry: ISettingRegistry | null) => {
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


    const { commands } = app;
    commands.addCommand(cmdInitializeNbgrader, {
      label: 'Initialize Nbgrader',
      caption: 'Initialize Nbgrader',
      execute: () => {
        requestAPI<any>('initialize-nbgrader')
          .then(data => { console.log(data); })
          .catch(reason => {
            console.log(`Error initializing nbgrader: ${reason}`);
          })
      }
    });
    commands.addCommand(cmdExportGrades, {
      label: 'Export Student Grades',
      caption: 'Export Student Grades',
      execute: () => {
        requestAPI<any>('extract-student-grades')
          .then(data => { console.log(data); })
          .catch(reason => {
            console.error(
              `The cscienv_nbgrader_extras server extension appears to be missing.\n${reason}`
            );
          });
      }
    });

    const autogradeMenu = new Menu({commands: app.commands});
    autogradeMenu.title.label = 'Autograde';

    const extrasMenu = new Menu({commands: app.commands});
    extrasMenu.title.label = 'Grading'
    extrasMenu.addItem({command: cmdInitializeNbgrader, args: {}});
    extrasMenu.addItem({command: cmdExportGrades, args: {}});
    extrasMenu.addItem({type: 'separator'});
    extrasMenu.addItem({type: 'submenu', 'submenu': autogradeMenu});
    mainMenu.addMenu(extrasMenu, {rank: 100});
  }
};

export default plugin;
