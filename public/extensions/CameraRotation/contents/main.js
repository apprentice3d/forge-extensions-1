/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// TurnTable extension illustrating camera rotation around the model
// by Denis Grigor, November 2018
// updated May 2020
//
///////////////////////////////////////////////////////////////////////////////

class TurnTableExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.viewer = viewer;
        this._group = null;
        this._button = null;
        this.customize = this.customize.bind(this);

        this.target_controller = null;
        this.camera_controller = null;
        this.camera = null;
        this.started = false;

        this.updateCameraAndTarget = this.updateCameraAndTarget.bind(this);
    }

    load() {
        if (this.viewer.model.getInstanceTree()) {
            this.customize();
        } else {
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.customize);
        }
        return true;
    }

    unload() {
        console.log('TurnTableExtension is now unloaded!');
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }

        this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.updateCameraAndTarget);
        this.viewer.overlays.removeMesh(this.target_controller, "reference");
        this.viewer.overlays.removeScene("reference");
        return true;
    }

    customize() {

        let viewer = this.viewer;

        this._button = new Autodesk.Viewing.UI.Button('turnTableButton');
        this._button.addClass('toolbarCameraRotation');
        this._button.setToolTip('Start/Stop Camera rotation');

        // _group
        this._group = new Autodesk.Viewing.UI.ControlGroup('CameraRotateToolbar');
        this._group.addControl(this._button);
        this.viewer.toolbar.addControl(this._group);

        let needsUpdate = true;
        let started = this.started;
        this.camera = viewer.getCamera();

        this.target_controller = new THREE.Mesh();
        this.camera_controller = new THREE.Mesh();

        this.target_controller.add(this.camera_controller);
        viewer.overlays.addScene("reference");
        viewer.overlays.addMesh(this.target_controller, "reference");

        viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.updateCameraAndTarget);


        let rotateCamera = () => {
            if (needsUpdate) {
                needsUpdate = false;
                console.log("updated once");
                this.updateCameraAndTarget();
            }
            if (started) {
                requestAnimationFrame(rotateCamera);
            }
            const speed = Math.PI / 180;
            this.target_controller.rotateZ(speed);
            let updated_camera_target = this.target_controller.getWorldPosition();
            let updated_camera_position = this.camera_controller.getWorldPosition();

            this.camera.position.set(updated_camera_position.x, updated_camera_position.y, updated_camera_position.z);
            this.camera.lookAt(new THREE.Vector3(updated_camera_target.x, updated_camera_target.y, updated_camera_target.z));
            this.camera.up.set(0, 0, 1);
            this.viewer.impl.sceneUpdated(true);
        };

        this._button.onClick = function (e) {
            started = !started;
            if (started) {
                rotateCamera();
            }
        };

    }

    updateCameraAndTarget() {


        this.camera = viewer.getCamera();

        this.target_controller.position.set(this.camera.target.x, this.camera.target.y, this.camera.target.z);

        //TODO: Check the bug of camera jump when moving camera before triggering rotation play
        this.camera_controller.position.set(
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z)

    }

}

Autodesk.Viewing.theExtensionManager.registerExtension('CameraRotation',
    TurnTableExtension);