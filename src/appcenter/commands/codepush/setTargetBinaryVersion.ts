import { validRange } from 'semver';
import * as vscode from 'vscode';
import { AppCenterOS, Constants } from '../../../constants';
import { CommandParams, CurrentApp } from '../../../helpers/interfaces';
import { VsCodeUtils } from '../../../helpers/vsCodeUtils';
import { Strings } from '../../../strings';
import { RNCPAppCommand } from './rncpAppCommand';

export default class SetTargetBinaryVersion extends RNCPAppCommand {
    constructor(params: CommandParams) {
        super(params);
    }

    public async runNoClient(): Promise<void> {
        if (!await super.runNoClient()) {
            return;
        }
        return this.getCurrentApp().then((app: CurrentApp) => {
            if (!app) {
                VsCodeUtils.ShowWarningMessage(Strings.NoCurrentAppSetMsg);
                return null;
            }
            if (!this.hasCodePushDeployments(app)) {
                VsCodeUtils.ShowWarningMessage(Strings.NoDeploymentsMsg);
                return null;
            }
            return app;
        }).then((app) => {
            if (!app) {
                return void 0;
            }
            return vscode.window.showInputBox({ prompt: Strings.PleaseProvideTargetBinaryVersion, ignoreFocusOut: true })
                .then(appVersion => {
                    if (!appVersion) {
                        // if user press esc do nothing then
                        return void 0;
                    }
                    if (appVersion !== Constants.AppCenterDefaultTargetBinaryVersion && !validRange(appVersion)) {
                        VsCodeUtils.ShowWarningMessage(Strings.InvalidAppVersionParamMsg);
                        return void 0;
                    }

                    return this.saveCurrentApp(
                        app.identifier,
                        AppCenterOS[app.os], {
                            currentDeploymentName: app.currentAppDeployments.currentDeploymentName,
                            codePushDeployments: app.currentAppDeployments.codePushDeployments
                        },
                        appVersion,
                        app.type,
                        app.isMandatory,
                        app.appSecret
                    ).then((currentApp) => {
                        if (!currentApp) {
                            return;
                        }
                        if (appVersion) {
                            VsCodeUtils.ShowInfoMessage(`Changed target binary version to '${appVersion}'`);
                        } else {
                            VsCodeUtils.ShowInfoMessage(`Changed target binary version to automatically fetched`);
                        }
                    });
                });
        });
    }
}
