import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import subprocess
import os
import re
import asyncio

class ExportHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        HOME = os.environ['HOME']
        proc = subprocess.run(['nbgrader', 'export'], cwd=f'{HOME}/nbgrader', capture_output=True)
        if proc.returncode == 0:
            with open(f'{HOME}/nbgrader/grades.csv', 'r') as csv:
                self.finish(json.dumps({
                    'data': csv.read()
                }))
        else:
            self.set_status(500)
            self.finish(json.dumps({
                'data': [],
                'message': f'Failed to export grades: {proc.stderr.decode("utf-8")}'
            }))

class InitializeHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        HOME = os.environ['HOME']
        proc = await asyncio.create_subprocess_exec('nbgrader', 'quickstart', '.', cwd=f'{HOME}/nbgrader')
        rc = await proc.wait()
        if rc == 0:
            # Remove the automatically created students.
            subprocess.run(['nbgrader', 'db', 'student', 'remove', 'bitdiddle'], cwd=f'{HOME}/nbgrader')
            subprocess.run(['nbgrader', 'db', 'student', 'remove', 'hacker'], cwd=f'{HOME}/nbgrader')
            subprocess.run(['nbgrader', 'db', 'student', 'remove', 'reasoner'], cwd=f'{HOME}/nbgrader')
            subprocess.run(['rm', '-f', 'nbgrader_config.py'], cwd=f'{HOME}/nbgrader')
            self.finish(json.dumps({
                'data': 'Nbgrader Initialized'
            }))
        else:
            self.set_status(500)
            self.finish(json.dumps({
                'data': [],
                'message': 'Failed to initialize Nbgrader'
            }))

class AssignmentListHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        proc = subprocess.run(['nbgrader', 'list'], capture_output=True)
        if proc.returncode == 0:
            COURSE = os.environ['COURSE']
            assignments = re.findall(f'{COURSE} ([\\w ]+)', proc.stderr.decode('utf-8'))
            self.finish(json.dumps({
                'data': assignments
            }))
        else:
            self.set_status(500)
            self.finish(json.dumps({
                'data': [],
                'message': f'Failed to fetch assignments: {proc.stderr.decode("utf-8")}'
            }))

class AutogradeHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self, assignment):
        collect = subprocess.run(['nbgrader', 'collect', '--update', '--before-duedate', assignment], capture_output=True)
        if collect.returncode != 0:
            self.set_status(500)
            self.finish(json.dumps({
                'data': [],
                'message': f'Failed to collect {assignment} for autograding: {collect.stderr.decode("utf-8")}'
            }))
            return

        autograde = await asyncio.create_subprocess_exec('nbgrader', 'autograde', assignment, '--force')
        rc = await autograde.wait()
        if rc != 0:
            self.set_status(500)
            self.finish(json.dumps({
                'data': [],
                'message': f'Failed to autograde {assignment}'
            }))
            return

        self.finish(json.dumps({
            'data': f'Autograded {assignment}'
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = url_path_join(web_app.settings["base_url"], "cscienv-nbgrader-extras")
    export_url = url_path_join(base_url, "extract-student-grades")
    list_url = url_path_join(base_url, "list-assignments")
    init_url = url_path_join(base_url, "initialize-nbgrader")
    autograde_url = url_path_join(base_url, "autograde/(.*)")
    
    handlers = [(init_url, InitializeHandler),
                (export_url, ExportHandler),
                (list_url, AssignmentListHandler),
                (autograde_url, AutogradeHandler)]
    web_app.add_handlers(host_pattern, handlers)
