import * as vscode from 'vscode';
import { AppCenterOS } from '../../../constants';
import { CommandParams, CurrentApp } from '../../../helpers/interfaces';
import { VsCodeUtils } from '../../../helpers/vsCodeUtils';
import { Strings } from '../../../strings';
import { RNCPAppCommand } from './rncpAppCommand';

export default class SetCurrentDeployment extends RNCPAppCommand {
    constructor(params: CommandParams) {
        super(params);
    }

    public async runNoClient(): Promise<boolean | void> {
        if (!await super.runNoClient()) {
            return;
        }
        this.getCurrentApp().then((currentApp: CurrentApp) => {
            if (!currentApp) {
                VsCodeUtils.ShowWarningMessage(Strings.NoCurrentAppSetMsg);
                return;
            }
            if (!this.hasCodePushDeployments(currentApp)) {
                VsCodeUtils.ShowWarningMessage(Strings.NoDeploymentsMsg);
                return;
            }
            const deploymentOptions: string[] = currentApp.currentAppDeployments.codePushDeployments.map((deployment) => {
                return deployment.name;
            });
            vscode.window.showQuickPick(deploymentOptions, { placeHolder: Strings.SelectCurrentDeploymentMsg })
                .then((deploymentName) => {
                    if (deploymentName) {
                        this.saveCurrentApp(
                            currentApp.identifier,
                            AppCenterOS[currentApp.os], {
                                currentDeploymentName: deploymentName,
                                codePushDeployments: currentApp.currentAppDeployments.codePushDeployments
                            },
                            currentApp.targetBinaryVersion,
                            currentApp.type,
                            currentApp.isMandatory,
                            currentApp.appSecret
                        );
                        VsCodeUtils.ShowInfoMessage(Strings.YourCurrentDeploymentMsg(deploymentName));
                    }
                });
        });
    }
}
