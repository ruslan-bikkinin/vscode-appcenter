import * as vscode from "vscode";
import * as Settings from ".";
import { CommandNames } from "../../../constants";
import { CommandParams } from "../../../helpers/interfaces";
import { CustomQuickPickItem } from "../../../helpers/vsCodeUtils";
import { Strings } from "../../../strings";
import { Command } from '../command';

/* Internal command */
export default class ShowMenu extends Command {
    private _params: CommandParams;
    constructor(params: CommandParams) {
        super(params);
        this._params = params;
    }

    public async run(): Promise<boolean | void> {
        if (!await super.run()) {
            return false;
        }

        const menuOptions: CustomQuickPickItem[] = [];

        const profiles = await this.appCenterAuth.getProfiles();
        if (profiles.length > 1) {
            menuOptions.push(<CustomQuickPickItem>{
                label: Strings.SwitchAccountMenuLabel,
                description: "",
                target: CommandNames.Settings.SwitchAccount
            });
        }

        menuOptions.push(<CustomQuickPickItem>{
            label: Strings.LoginToAnotherAccountMenuLabel,
            description: "",
            target: CommandNames.Settings.LoginToAnotherAccount
        });

        menuOptions.push(<CustomQuickPickItem>{
            label: Strings.LogoutMenuLabel,
            description: "",
            target: CommandNames.Settings.Logout
        });

        const vstsProfiles = await this.vstsAuth.getProfiles();
        if (vstsProfiles.length > 1) {
            menuOptions.push(<CustomQuickPickItem>{
                label: Strings.VstsSwitchAccountMenuLabel,
                description: "",
                target: CommandNames.Settings.SwitchAccountVsts
            });
        }

        menuOptions.push(<CustomQuickPickItem>{
            label: Strings.VstsLoginToAnotherAccountMenuLabel,
            description: "",
            target: CommandNames.Settings.LoginVsts
        });

        menuOptions.push(<CustomQuickPickItem>{
            label: Strings.VstsLogoutMenuLabel,
            description: "",
            target: CommandNames.Settings.LogoutVsts
        });

        return this.showQuickPick(menuOptions);
    }

    private showQuickPick(menuOptions: CustomQuickPickItem[]): Promise<void> {
        return new Promise((resolve) => {
            return vscode.window.showQuickPick(menuOptions, { placeHolder: Strings.MenuTitlePlaceholder })
                .then((selected: CustomQuickPickItem) => {
                    if (!selected) {
                        // User cancel selection
                        resolve();
                        return;
                    }

                    switch (selected.target) {
                        case (CommandNames.Settings.SwitchAccount):
                            new Settings.SwitchAccount(this._params).runNoClient();
                            break;

                        case (CommandNames.Settings.LoginToAnotherAccount):
                            new Settings.LoginToAnotherAccount(this._params).run();
                            break;

                        case (CommandNames.Settings.Logout):
                            new Settings.Logout(this._params).runNoClient();
                            break;

                        case (CommandNames.Settings.LoginVsts):
                            new Settings.LoginToVsts(this._params).runNoClient();
                            break;

                        case (CommandNames.Settings.SwitchAccountVsts):
                            new Settings.SwitchVstsAccount(this._params).runNoClient();
                            break;

                        case (CommandNames.Settings.LogoutVsts):
                            new Settings.LogoutVsts(this._params).runNoClient();
                            break;

                        default:
                            // Ideally shouldn't be there :)
                            this.logger.error("Unknown App Center menu command");
                            break;
                    }
                    resolve();
                });
        });
    }
}
