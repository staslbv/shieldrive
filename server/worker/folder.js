"use strict";
const gdrive = require("../REST/gdrive");
const apishield = require("../apishield");
const _ = require('underscore');
const GDRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
class CGEntry {
    constructor(user, id, metadata) {
        this.metadata = metadata;
        this.user = user;
        this.entryId = id;
        this.permissions = undefined;
        this.role = undefined;
        this.canRW = false;
        this.flagOwner = false;
        this.contacts = [];
    }
    get hasLoadedMetadata() {
        return (_.isObject(this.metadata) &&
            _.isString(this.metadata.id) &&
            _.isString(this.metadata.mimeType));
    }
    get isFolder() {
        return (this.metadata.mimeType == GDRIVE_FOLDER_MIME_TYPE);
    }
    //load metadata: parents, owners, title, mimeType, fileSize, modifiedDate
    resolve_loadMetadata() {
        return new Promise((resolve, reject) => {
            if (typeof this.metadata == 'object') {
                resolve(this.metadata);
            }
            else {
                return gdrive.list_file_metadata(this.user, this.entryId)
                    .then((e) => resolve((this.metadata = e)))
                    .catch(() => reject());
            }
        });
    }
    // load contacts: emailAddress, role, name
    resolve_loadPermissions() {
        return new Promise((resolve, reject) => {
            return gdrive.rest_file_contacts(this.user, this.entryId)
                .then((e) => resolve((this.permissions = e)))
                .catch(() => reject());
        });
    }
    // iterate object permissions 
    resolve_identifyCallerPermissions() {
        return new Promise((resolve, reject) => {
            _.each(_.indexBy(this.permissions, 'emailAddress'), (value, key) => {
                let mail = key.toLowerCase();
                if (this.user.account.user.email.toLocaleLowerCase() == mail ||
                    this.user.account.account.key.toLocaleLowerCase() == mail) {
                    this.role = value;
                }
                else {
                    this.contacts.push(value);
                }
            });
            resolve(this.role);
        });
    }
    // set canRW and flagOwner flags
    resolve_callerPermissions() {
        return new Promise((resolve, reject) => {
            if (!this.role) {
                resolve(false);
            }
            else {
                this.canRW = (this.role.role == 'owner' || this.role.role == 'writer');
                this.flagOwner = (this.role.role == 'owner');
                resolve(this.canRW);
            }
        });
    }
    // general load function. 
    loadMetadata() {
        return new Promise((resolve, reject) => {
            if (this.metadata) {
                resolve(true);
            }
            else {
                return this.resolve_loadMetadata()
                    .then((e) => resolve(true))
                    .catch(() => reject());
            }
        });
    }
    resolveRW() {
        return new Promise((resolve, reject) => {
            return this.resolve_loadPermissions()
                .then((e) => { return this.resolve_identifyCallerPermissions(); })
                .then((e) => { return this.resolve_callerPermissions(); })
                .then((e) => resolve(this.canRW))
                .catch(() => reject());
        });
    }
    // sync all contacts to IShieldoxContact
    syncAB() {
        return new Promise((resolve, reject) => {
            return Promise.all(this.contacts.map((contact) => {
                return apishield.syncContactPromiseResolve(this.user, contact.emailAddress, contact.name);
            })).then((e) => {
                resolve(e);
            });
        });
    }
}
class CGFolderSynk extends CGEntry {
    // synchronize current folder and get objectId
    syncFolder() {
        return new Promise((resolve, reject) => {
            return apishield.syncFolder(this.user, this.metadata.id, this.metadata.title)
                .then((e) => resolve((this.shieldObj = e)))
                .catch(() => reject());
        });
    }
    promise_loadView() {
        return new Promise((resolve, reject) => {
            return this.loadMetadata() // got permissions and shared list
                .then((e) => {
                return gdrive.list_objects_folder(this.user, this.entryId);
            })
                .then((e) => {
                _.each(_.groupBy(e, 'mimeType'), (e, type) => {
                    let flagFolder = (type == GDRIVE_FOLDER_MIME_TYPE);
                    e.forEach((e) => {
                        if (flagFolder) {
                            this.folders.push(new CGFolderSynk(this.user, e.id, e));
                        }
                        else {
                            this.files.push(new CGFileSynk(this.user, e.id, e, this));
                        }
                    });
                });
                return this.promise_loadViewChildren();
            })
                .then((e) => { return this.promise_loadViewShieldPermissions(); })
                .then((e) => resolve(e))
                .catch(() => reject());
        });
    }
    promise_loadViewChildren() {
        return new Promise((resolve, reject) => {
            return this.promise_loadViewChildren_Folders()
                .then(() => {
                return this.promise_loadViewChildren_Files();
            })
                .then(() => resolve(true))
                .catch(() => reject());
        });
    }
    promise_loadViewChildren_Files() {
        return new Promise((resolve, reject) => {
            return Promise.all(this.files.map((file) => {
                return file.loadMetadata();
            })).then(() => {
                resolve(true);
            }).catch(() => reject());
        });
    }
    promise_loadViewChildren_Folders() {
        return new Promise((resolve, reject) => {
            return Promise.all(this.folders.map((folder) => {
                return folder.loadMetadata();
            })).then(() => {
                resolve(true);
            }).catch(() => reject());
        });
    }
    promise_loadViewShieldPermissions() {
        return new Promise((resolve, reject) => {
            const pFolders = [];
            const pDocuments = [];
            // fill up array for getOptions call
            this.folders.forEach((folder) => pFolders.push({ cloudKey: folder.entryId }));
            this.files.forEach((file) => pDocuments.push({ cloudKey: file.entryId }));
            // call shieldox
            return apishield.options(this.user, {
                folders: pFolders,
                documents: pDocuments
            }).then((e) => {
                var a = e.documents.map((e) => { return _.pick(e, 'color', 'cloudKey'); });
                var b = e.folders.map((e) => { return _.pick(e, 'color', 'cloudKey'); });
                a.forEach((e) => {
                    this.files.forEach((file) => {
                        if (file.entryId == e.cloudKey) {
                            e.path = file.metadata.title;
                            e.hasmenu = file.canRW;
                        }
                    });
                });
                b.forEach((e) => {
                    this.folders.forEach((folder) => {
                        if (folder.entryId == e.cloudKey) {
                            e.path = folder.metadata.title;
                            e.hasmenu = folder.canRW;
                        }
                    });
                });
                resolve({
                    folders: b,
                    files: a
                });
            }).catch(() => reject());
        });
    }
    colorUiLoad() {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                if (!this.canRW) {
                    reject(403);
                }
                else {
                    return this.syncFolder();
                }
            })
                .then((e) => { return this.calcUiOptions(); })
                .then((e) => { resolve(e); })
                .catch(() => reject(500));
        });
    }
    calcUiOptions() {
        return new Promise((resolve, reject) => {
            var args = {
                documents: [],
                folders: [{ cloudKey: this.entryId }]
            };
            return apishield.options(this.user, args)
                .then((e) => {
                let colors = _.pick(e.folders[0], 'color', 'colors');
                let response = {
                    cloudKey: this.entryId,
                    objectId: this.shieldObj.objectId,
                    color: colors.color,
                    colors: colors.colors
                };
                resolve(response);
            })
                .catch(() => reject(500));
        });
    }
    protect(color) {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                if (!this.canRW) {
                    reject(403);
                }
                else {
                    return this.syncFolder();
                }
            })
                .then((e) => { return apishield.colorFolder(this.user, { color: color, objectId: this.shieldObj.objectId }); })
                .then((e) => {
                resolve(e);
            })
                .catch(() => reject(500));
        });
    }
    constructor(user, entryId, metadata) {
        super(user, entryId, metadata);
        this.shieldObj = undefined;
        this.folders = [];
        this.files = [];
    }
}
class CGFileSynk extends CGEntry {
    protect(color) {
        return new Promise((resolve, reject) => {
            return this.loadIoDataAndGetStatus()
                .then((code) => {
                if (this.parent.shieldObj.color > 0 && color == 0) {
                    reject(409); // can not unprotect file in folder ...
                }
                else {
                    this.contentIoArgs.color = color;
                    this.contentIoArgs.protect = true;
                    return apishield.lock(this.user, this.contentIoArgs);
                }
            })
                .then((e) => {
                this.contentBuffer.data = e.data;
                this.contentIoArgs = e;
                if (!e.dirty) {
                    return new Promise((resolve, reject) => { resolve(true); });
                }
                else {
                    return gdrive.file_upload(this.user, this.metadata.id, this.contentBuffer);
                }
            })
                .then((e) => {
                delete this.contentIoArgs.data;
                delete this.contentIoArgs.protect;
                resolve(this.contentIoArgs);
            })
                .catch((code) => reject(code));
        });
    }
    colorUiLoad() {
        return new Promise((resolve, reject) => {
            return this.loadIoDataAndGetStatus()
                .then((e) => {
                if (!this.canRW) {
                    reject(403);
                }
                else {
                    return apishield.lock(this.user, this.contentIoArgs);
                }
            })
                .then((e) => {
                this.contentBuffer.data = e.data;
                this.contentIoArgs = e;
                if (!_.isString(e.objectId) || e.objectId.length == 0) {
                    reject(415);
                }
                else {
                    return this.calcUiOptions();
                }
            })
                .then((e) => {
                resolve(e);
            })
                .catch((code) => reject(code));
        });
    }
    calcUiOptions() {
        return new Promise((resolve, reject) => {
            var args = {
                folders: [],
                documents: [{ cloudKey: this.entryId }]
            };
            return apishield.options(this.user, args)
                .then((e) => {
                let colors = _.pick(e.documents[0], 'color', 'colors');
                let response = {
                    cloudKey: this.entryId,
                    objectId: this.contentIoArgs.objectId,
                    color: colors.color,
                    colors: colors.colors
                };
                resolve(response);
            })
                .catch(() => reject(500));
        });
    }
    // load metadata of parent and child, determine if caller has acceess,download file,sync folder and fill IO args
    loadIoDataAndGetStatus() {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.loadObjectWithContacts(); })
                .then((e) => {
                if (typeof this.role == 'undefined') {
                    reject(401);
                }
                else {
                    return gdrive.file_download(this.user, this.metadata.id);
                }
            })
                .then((e) => {
                this.contentBuffer = e;
                return this.parent.syncFolder();
            })
                .then((e) => {
                this.contentIoArgs = this.getIoArgs(this.parent.shieldObj.objectId, this.contentBuffer.data);
                resolve(200);
            })
                .catch(() => reject(500));
        });
    }
    loadObjectWithContacts() {
        return new Promise((resolve, reject) => {
            let parent = this.parent;
            if (!parent) {
                parent = new CGFolderSynk(this.user, this.entryId, undefined);
            }
            return parent.loadMetadata()
                .then((e) => { return parent.resolveRW(); })
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                this.parent = parent;
                this.privateContacts = this.calcPrivateContacts();
                console.log('number private contacts: ' + this.privateContacts.length);
                resolve(true);
            })
                .catch(() => reject());
        });
    }
    calcPrivateContacts() {
        const buffer = [];
        _.each(this.contacts, (contact) => {
            if (!(_.findWhere(this.parent.contacts, contact))) {
                buffer.push(contact);
            }
        });
        return buffer;
    }
    getIoArgs(folderId, data) {
        return {
            dirty: false,
            color: 0,
            objectId: undefined,
            data: data,
            protect: false,
            date: Date.parse(this.metadata.modifiedDate),
            path: this.metadata.title,
            cloudKey: this.metadata.id,
            folderId: folderId,
            size: this.metadata.fileSize
        };
    }
    constructor(user, entryId, metadata, parent) {
        super(user, entryId, metadata);
        this.parent = parent;
    }
}
function getViewOptions(user, entryId) {
    return new Promise((resolve, reject) => {
        const sync = new CGFolderSynk(user, entryId, undefined);
        return sync.promise_loadView()
            .then((e) => resolve(e))
            .catch(() => reject());
    });
}
exports.getViewOptions = getViewOptions;
function protectFile(user, entryId, color) {
    return new Promise((resolve, reject) => {
        return (new CGFileSynk(user, entryId, undefined, undefined)).protect(color)
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.protectFile = protectFile;
function protectFolder(user, entryId, color) {
    return new Promise((resolve, reject) => {
        return (new CGFolderSynk(user, entryId, undefined)).protect(color)
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.protectFolder = protectFolder;
function colorUiLoadFile(user, entryId) {
    return new Promise((resolve, reject) => {
        return (new CGFileSynk(user, entryId, undefined, undefined)).colorUiLoad()
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.colorUiLoadFile = colorUiLoadFile;
function colorUiLoadFolder(user, entryId) {
    return new Promise((resolve, reject) => {
        return (new CGFolderSynk(user, entryId, undefined)).colorUiLoad()
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.colorUiLoadFolder = colorUiLoadFolder;
