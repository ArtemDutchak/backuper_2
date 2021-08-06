'use strict'

import { app, protocol, BrowserWindow, BrowserView, ipcMain } from 'electron'
import {
  createProtocol,
  // installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'


const os = require("os")
const path = require('path')
const fs = require("fs-extra")
const archiver = require('archiver');
const xlsx = require("node-xlsx")

import locale from "../modules/localization";
function $t(key){
  const l =  locale[main_settings.localization]
  return eval(`l.${key}`)
}

import utilites from "../modules/utilites";

let main_settings = require('../modules/main_settings');

const desktop_path = path.join(require('os').homedir(), 'Desktop');

const data_dir = path.join(app.getPath('userData'), 'data')
const db_dir = path.join(data_dir, 'datastore')

const filename_devider = '...'

// if (!fs.existsSync(data_dir)){
//   fs.mkdirSync(data_dir)
// }

fs.ensureDir(data_dir)

import database from "../modules/database";
database.init(db_dir)


let win
let backup_interval


protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {

  win = new BrowserWindow({ width: 800, height: 600, webPreferences: {
    nodeIntegration: true,
    enableRemoteModule: true,
    webviewTag: true
  } })
  win.removeMenu()
  win.setMenuBarVisibility(false)
  win.maximize()

  if (process.env.WEBPACK_DEV_SERVER_URL) {

    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')

    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {

  if (win === null) {
    createWindow()
  }
})
app.on('ready', async () => {
  if (isDevelopment) {
    try {
      // await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }

  }

  await deal_with_settings()

  const all_settings = await get_settings()
  for (const setting of all_settings) {
    if (setting.name == 'scan_period') {
      if (setting.value) {
        backup_interval = setInterval(scan_for_changes, setting.value * 1000)
      }else{
        backup_interval = null
      }
    }
  }

  createWindow()
})


if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}


async function deal_with_settings(){
  for (var setting_name in main_settings) {
    if (main_settings.hasOwnProperty(setting_name)) {
      const setting_value = main_settings[setting_name]
      const setting_saved = await database.settings.find({name:setting_name})
      if (setting_saved.success) {
        if (setting_saved.data.length) {
          main_settings[setting_name] = setting_saved.data[0].value
        }else{
          database.settings.insert({
            name: setting_name,
            value: setting_value
          })
        }
      }
    }
  }
}

async function get_settings(){
  const res = await database.settings.find({})
  if (res.success) {
    return res.data
  }
  return []
}

async function get_log(section){
  const out = []
  const n = Date.now()
  const res = await database.log.sort({
    section
  },{updatedAt: -1})
  if (res.success) {
    for (const log of res.data) {

      const now_date = Date.now()
      const period = now_date - parseInt(main_settings.log_period) * 3600000
      const lod_date = Date.parse(log.createdAt)

      if (lod_date > period) {
        log.date_time = utilites.get_date(log.createdAt)
        out.push(log)
      }

    }
  }
  return out
}


ipcMain.on('compact_database',async function(e, db_name){
  await database[db_name].compact(500)
})


ipcMain.on('refresh_localization',async function(e){
  win.webContents.send('set_localization', main_settings.localization)
})

ipcMain.on('refresh_settings',async function(e){
  win.webContents.send('settings_from_server_to_app', await get_settings())
})

ipcMain.on('refresh_log',async function(e, section){
  win.webContents.send('logs_from_server_to_app', await get_log(section))
})
ipcMain.on('save_setting',async function(e, setting){

  if (setting.name == 'scan_period') {

    if (backup_interval) {
      clearInterval(backup_interval)
    }

    if (setting.value) {
      scan_for_changes()
      backup_interval = setInterval(scan_for_changes, setting.value * 1000)
    }else{
      backup_interval = null
    }

  }

  let res = await database.settings.update({
    _id: setting._id,
  },{$set:{
    value: setting.value,
  }},{})
  await deal_with_settings()
  win.webContents.send('settings_from_server_to_app', await get_settings())
})

ipcMain.on('switch_lang',async function(e, lang){
  let res = await database.settings.update({
    name: 'localization',
  },{$set:{
    value: lang,
  }},{})
})


async function scan_for_changes(){

  let source_path = ''
  let dest_path = ''

  const all_settings = await get_settings()

  for (const setting of all_settings) {
    if (setting.name == 'main_dir_source_path') {
      source_path = setting.value
    }else if (setting.name == 'main_dir_dest_path') {
      dest_path = setting.value
    }
  }

  if (!source_path || !dest_path || source_path == dest_path) {
    return
  }

  const missing_paths = await check_source_exists(source_path, dest_path)
  if (missing_paths.length) {

    let need_sound_notify = false

    for (const missing_path of missing_paths) {

      const need_record = await log_need_record(missing_path)

      if (!need_record) {
      await database.log.insert({
          section: 'backup',
          type: 'warning',
          text: missing_path
        })
        need_sound_notify = true
      }

    }

    if (need_sound_notify) {
      win.webContents.send('logs_from_server_to_app', await get_log('backup'))
      win.webContents.send('play_audio', 'audio_warning')
      await utilites.delay(3000)
    }
  }

  const root_dirs = await get_root_items('dirs', source_path)
  const root_files = await get_root_items('files', source_path)

  if (root_files.length) {
    // console.log(root_files)
  }

  let was_backup = false

  for (const root_dir of root_dirs) {

    const relative_source = path.join(source_path, root_dir)
    const relative_dest = path.join(dest_path, root_dir)

    fs.ensureDir(relative_dest)

    const lvl_1_dirs = await get_root_items('dirs', relative_source)
    const lvl_1_files = await get_root_items('files', relative_source)

    for (const lvl_1_dir of lvl_1_dirs) {

      const stats = fs.lstatSync(path.join(relative_source, lvl_1_dir))
      const mtime = parseInt(stats.mtimeMs)

      let need_backup = false

      const exist_mtime = await is_archive_item_exist_in_dest(relative_dest, lvl_1_dir)

      if (exist_mtime) {
        if (mtime > exist_mtime) {
          need_backup = true
        }
      }else{
        need_backup = true
      }

      if (need_backup) {
        await backup({
          source: relative_source,
          dest: relative_dest,
          relative:lvl_1_dir,
          type:'dir',
          archivate: true,
          username: false,
          timecode: false
        })
        was_backup = true
      }

    }
    for (const lvl_1_file of lvl_1_files) {

      const stats = fs.lstatSync(path.join(relative_source, lvl_1_file))
      const mtime = parseInt(stats.mtimeMs)

      let need_backup = false

      const exist_mtime = await is_archive_item_exist_in_dest(relative_dest, lvl_1_file)

      if (exist_mtime) {
        if (mtime > exist_mtime) {
          need_backup = true
        }
      }else{
        need_backup = true
      }

      if (need_backup) {
        await backup({
          source: relative_source,
          dest: relative_dest,
          relative:lvl_1_file,
          type:'file',
          archivate: true,
          username: true,
          timecode: true
        })
        was_backup = true
      }

    }

  }

  if (missing_paths.length || was_backup) {
    await database.log.compact(1000)
  }

  if (was_backup) {
    win.webContents.send('logs_from_server_to_app', await get_log('backup'))
    win.webContents.send('play_audio', 'audio_success')
  }

}

function check_source_exists(source_path, dest_path){
  return new Promise(async (resolve)=>{

    const out = []

    const root_dirs = await get_root_items('dirs', dest_path)

    for (const root_dir of root_dirs) {

      const relative_source = path.join(source_path, root_dir)

      if (!fs.existsSync(relative_source)){
        if (!out.includes(relative_source)) {
          out.push(relative_source)
        }
      }else{

        const backuped_archives = await get_root_items('files', path.join(dest_path, root_dir))
        for (const backuped_archive of backuped_archives) {

          let arr = []

          if (backuped_archive.includes(filename_devider)) {
            arr = backuped_archive.split(filename_devider)
          }else if(backuped_archive.includes('.zip')) {
            arr = backuped_archive.split('.zip')
          }

          if (arr.length) {
            const source_file_path = path.join(source_path, root_dir, arr[0])
            if (!fs.existsSync(source_file_path)){
              if (!out.includes(source_file_path)) {
                out.push(source_file_path)
              }
            }
          }

        }

      }

    }

    resolve(out)
  })
}

function get_root_items(type, source_path){
  return new Promise((resolve)=>{
    const out = []

    const files = fs.readdirSync(source_path)

    for (const file of files) {
      const full_file_path = path.join(source_path, file)
      const stats = fs.lstatSync(full_file_path)

      if (type == 'dirs') {
        if (stats.isDirectory()) {
          out.push(file)
        }
      }else if (type == 'files') {
        if (stats.isFile()) {
          out.push(file)
        }
      }
    }

    resolve(out)

  })
}

function is_item_exist_in_dest(dest_path, relative_path){
  return new Promise(async (resolve)=>{

    const full_path = path.join(dest_path, relative_path)

    let out = 0

    if (fs.existsSync(full_path)) {
      const stats = fs.lstatSync(full_path)
      const out = parseInt(stats.mtimeMs)
    }

    resolve(out)

  })
}

function is_archive_item_exist_in_dest(dest_path, relative_path){
  return new Promise(async (resolve)=>{

    let out = 0

    const files = await get_root_items('files', dest_path)
    const files_mtimeMs = []
    for (const file of files) {
      if (file.includes(relative_path + filename_devider) && file.includes('.zip')) {
        const full_path = path.join(dest_path, file)
        const parsed = path.parse(full_path)
        if (parsed.ext == '.zip') {
          const stats = fs.lstatSync(full_path)
          out = parseInt(stats.mtimeMs)
          files_mtimeMs.push(out)
        }
      }else if(file == relative_path + '.zip'){
        const full_path = path.join(dest_path, file)
        const parsed = path.parse(full_path)
        const stats = fs.lstatSync(full_path)
        out = parseInt(stats.mtimeMs)
        files_mtimeMs.push(out)
      }
    }
    if (files_mtimeMs.length) {
      out = Math.max(...files_mtimeMs)
      resolve(out)
      return
    }

    resolve(out)

  })
}
function backup(options){

  // console.log('backup ' + options.relative)

  return new Promise(async (resolve)=>{

    let source_path = ''
    let dest_path = ''

    if (options.type == 'file') {

      source_path = path.join(options.source)
      dest_path = path.join(options.dest)

    }else if (options.type == 'dir') {

      source_path = path.join(options.source, options.relative)
      dest_path = path.join(options.dest, options.relative)

    }

    if (options.archivate) {
      const archivated = await zip({
        source: source_path,
        dest: dest_path,
        relative:options.relative,
        type:options.type,
        archivate: true,
        username: true,
        timecode: true
      })

    await database.log.insert({
        section: 'backup',
        type: 'success',
        text: archivated.source
      })

    }

    resolve(true)

  })
}

function log_need_record(text) {
  return new Promise(async (resolve)=>{

    let founded = true

    const last_warning_res = await database.log.sort({
      text,
      type: 'warning',
      section: 'backup'
    },{updatedAt: -1})
    if (last_warning_res.success) {
      if (last_warning_res.data.length) {
        const last_warning_time = last_warning_res.data[0].createdAt
        const last_success_res = await database.log.sort({
          text,
          type: 'success',
          section: 'backup'
        },{updatedAt: -1})
        if (last_success_res.success) {
          if (last_success_res.data.length) {
            const last_success_time = last_success_res.data[0].createdAt
            if (last_success_time > last_warning_time) {
              founded = false
            }
          }
        }
      }
    }
    resolve(founded);return

  })
}

function zip(options) {
  return new Promise(async (resolve)=>{

    const archive = archiver('zip', { store: true, zlib: { level: 9 }})

    if (options.type == 'file') {
      const full_source_path = path.join(options.source, options.relative)
      let full_dest_path = path.join(options.dest, options.relative)

      if (options.username) {
        const username = os.userInfo().username
        full_dest_path = full_dest_path + filename_devider +  username
      }
      if (options.timecode) {
        full_dest_path = full_dest_path + filename_devider +  utilites.get_file_date()
      }

      const output = fs.createWriteStream(full_dest_path + '.zip')

      archive.on('error', (err) => { throw err })
      archive.pipe(output);
      archive.append(fs.createReadStream(full_source_path), { name: options.relative });
      archive.finalize()
      resolve({
        source: full_source_path,
        dest: full_dest_path,
      })
      return

    }else if (options.type == 'dir') {
      const output = fs.createWriteStream(options.dest + '.zip')
      archive.on('error', (err) => { throw err })
      archive.pipe(output)
      archive.directory(options.source, false);
      archive.finalize()
      resolve({
        source: options.source,
        dest: options.dest + '.zip',
      })
      return
    }


   resolve(false)

  })
}
