import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Notification } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Menu } from '@lumino/widgets';

import { requestAPI } from './handler';


const cmdExportGrades = 'cscienv_nbgrader_extras:extract-student-grades';
const cmdInitializeNbgrader = 'cscienv_nbgrader_extras:initialize-nbgrader';
const cmdAutogradeAssignment = 'cscienv_nbgrader_extras:autograde-assignment';

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
        Notification.promise(requestAPI<any>('initialize-nbgrader'), {
          pending: { message: 'Initializing Nbgrader...', options: { autoClose: false } },
          error: { message: (() => 'Failed to initialize Nbgrader') },
          success: { message: ((data: any) => data.data) }
        });
      }
    });
    commands.addCommand(cmdExportGrades, {
      label: 'Export Student Grades',
      caption: 'Export Student Grades',
      execute: () => {
        requestAPI<any>('extract-student-grades')
          .then(data => {
            const a = document.createElement('a');
            const blob = new Blob([data.data], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            
            a.href = url;
            a.download = 'grades.csv';
            a.click();

            window.URL.revokeObjectURL(url);
          })
          .catch(reason => {
            console.error(
              `Error exporting grades.\n${reason}`
            );
          });
      }
    });
    commands.addCommand(cmdAutogradeAssignment, {
      caption: 'Autograde Assignment',
      label: (args: any) => {
        return `Autograde ${args.assignment}`
      },
      execute: (args: any) => {
        Notification.promise(requestAPI<any>(`autograde/${args.assignment}`), {
          pending: { message: `Autograding ${args.assignment}...`, options: { autoClose: false } },
          error: { message: (() => `Failed to autograde ${args.assignment}`) },
          success: { message: ((data: any) => data.data) }
        });
        // requestAPI(`autograde/${args.assignment}`)
        //   .then(data => { console.log(data); })
        //   .catch(reason => {
        //     console.log(`Error autograding ${args.assignment}: ${reason}`);
        //   });
      }
    })

    const autogradeMenu = new Menu({commands: app.commands});
    autogradeMenu.title.label = 'Autograde';
    requestAPI<any>('list-assignments')
      .then(data => {
        for (const assignment of data.data) {
          autogradeMenu.addItem({command: cmdAutogradeAssignment, args: {assignment: assignment}})
        }
      })
      .catch(reason => {
        console.error(`######## cry: ${reason}`)
      });

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
