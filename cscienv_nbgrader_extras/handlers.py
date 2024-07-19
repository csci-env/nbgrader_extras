import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import subprocess
import os

HOME = os.environ['HOME']

class ExportHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        subprocess.run(['nbgrader', 'export'])
        self.finish(json.dumps({
            "data": "Grades exported"
        }))

class InitializeHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        proc = subprocess.run(['nbgrader', 'quickstart', '.'], cwd=f'{HOME}/nbgrader')
        subprocess.run(['rm', '-f', 'nbgrader_config.py'], cwd=f'{HOME}/nbgrader')
        if proc.returncode == 0:
            self.finish(json.dumps({
                'data': 'Nbgrader Initialized'
            }))
        else:
            self.set_status(500)
            self.finish(json.dumps({
                'data': 'Failed to initialize Nbgrader'
            }))

class AssignmentListHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        proc = subprocess.run(['nbgrader', 'list', os.environ.get('COURSE', '')], capture_output=True)
        self.finish(json.dumps({
            "data": proc.stdout.decode('utf-8')
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = url_path_join(web_app.settings["base_url"], "cscienv-nbgrader-extras")
    export_url = url_path_join(base_url, "extract-student-grades")
    list_url = url_path_join(base_url, "list-assignments")
    init_url = url_path_join(base_url, "initialize-nbgrader")
    
    handlers = [(init_url, InitializeHandler), (export_url, ExportHandler), (list_url, AssignmentListHandler)]
    web_app.add_handlers(host_pattern, handlers)
