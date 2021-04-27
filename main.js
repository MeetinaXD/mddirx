#!/usr/bin/env node

var fs = require('fs'),
    path = require('path');

const colors = require("colors");
const argv = require('yargs')
  .option('o', {
    alias : 'output',
    demand: false,
    default: 'listOutput.md',
    describe: 'the listing destination',
    type: 'string'
  })
  .option('i', {
    alias : 'input',
    demand: false,
    default: '.',
    describe: 'the listing srouce, must be a direction',
    type: 'string'
  })
  .option('exclude', {
    demand: false,
    default: '',
    describe: '(RegExp) exclude file/directory. the option cannot use with --include',
    type: 'string'
  })
  .option('include', {
    demand: false,
    default: '',
    describe: '(RegExp) include file/directory. the option cannot use with --exclude',
    type: 'string'
  })
  .option('dironly', {
    demand: false,
    default: false,
    describe: 'only printout directory',
    type: 'boolean'
  })
  .strict()
  .recommendCommands()
  .argv

argv.exclude = argv.exclude.trim()
argv.include = argv.include.trim()
argv.i = argv.i.trim()
argv.o = argv.o.trim()

if (argv.exclude.length > 0 && argv.include.length > 0){
  console.log(colors.red('--exclude cannot use with --match!'))
  throw new Error("--exclude cannot use with --match")
}

if (!fs.lstatSync(argv.i).isDirectory()){
  console.log(colors.red('--input must be a directory!'))
  throw new Error("--input must be a directory")
}

var folders = {};
var markdownText = '';
var depth = 0;
var exported = false;
var outputFileName = argv.o;
var searchPath = path.resolve(argv.i);
var key = searchPath;//.replace(/\//g,'');
var startFolder = searchPath.split('/')[searchPath.split('/').length - 2];
var startDepth = searchPath.split('/').length - 1;
var currentWorkingDirectory = process.cwd();

var ignoreList = [
  '\.git',
  'node_modules'
];

var includeList = argv.include.split(";")

if (argv.exclude.length > 0)
  ignoreList.push.apply(ignoreList, argv.exclude.split(";"))

ignoreList = ignoreList.map(e => (new RegExp(e, 'g')))
includeList = includeList.map(e => (new RegExp(e, 'g')))

const isContains = function(name){
  for (let i of ignoreList){
    if (i.test(name)){
      return false
    }
  }
  for (let i of includeList){
    if (i.test(name)){
      return true
    }
  }
  console.log("exclude", name)
  return false
}

var getFolders = function(path){
  fs.readdir(path, function(err, list){
    if (err) return done(err);
    list.forEach(function(item){
      if(fs.lstatSync(path + '/' + item).isDirectory() &&
        isContains(item)){
        var folderDepth = path.split('/').length;
        if(folderDepth > depth){
          depth = folderDepth;
        }
        var uniqueKey = path + '/' + item.replace(/\//g,'');
        folders[uniqueKey] = {
          depth: folderDepth,
          parentFolder: path,
          path: path + '/' + item,
          name: item,
          folders: [],
          files: [],
          logged: false,
          parsed: false,
          marked: false
        };
        getFolders(path + '/' + item, true);
      }
    });
    getFilesInFolders();
  });
};

var getFilesInFolders = function(){
  for (var key in folders) {
    if (folders.hasOwnProperty(key)) {
      getFiles(folders[key].path, key);
    }
  }
};

var getFiles = function(path, key){
  fs.readdir(path, function(err, list){
    list.forEach(function(item){
      if (isContains(item)){
        if(!fs.lstatSync(path + '/' + item).isDirectory()){
          if(folders[key].files.length === 0 || folders[key].files.indexOf(item) === -1){
            folders[key].files.push(item);
          }
        } else {
          if(folders[key].folders.indexOf(item) === -1){
            folders[key].folders.push(item);
          }
        }
      }
    });
    folders[key].parsed = true;
    listFolders();
  });
};

var listFolders = function(){
  var allParsed = true;
  var numFolders = 0;
  for(var key in folders){
    if(folders.hasOwnProperty(key)){
      numFolders++;
      if(!folders[key].logged || !folders[key].parsed){
        allParsed = false;
      }
      if(folders[key].parsed && !folders[key].logged){
        folders[key].logged = true;
      }
    }
  }
  if(allParsed && !exported){
    exported = true;
    generateMarkdown();
  }
};

var addFileName = function(name, indent){
  var indent = indent + 4;
  markdownText += '';
  for(var i = 0; i < indent; i++){
    markdownText += ' ';
  }
  markdownText += '|-- ' + name + '\n';
};

var addFolderName = function(name, index){
  if(folders[name] !== undefined){
    if(folders[name].marked){
      return;
    }
    var indent = (folders[name].depth - startDepth) * 4;
    markdownText += '';
    for(var i = 0; i < indent; i++){
      markdownText += ' ';
    }
    if(index === 1){
      markdownText += '|-- ' + startFolder + '\n';
    } else {
      markdownText += '|-- ' + folders[name].name + '\n';
    }
    if (!argv.dironly){
      folders[name].files.forEach(function(f){
        addFileName(f, indent);
      });
    }
    folders[name].marked = true;
    folders[name].folders.forEach(function(f){
      var path = name + '/' + f;
      addFolderName(path, 2);
    });
  }
};

var generateMarkdown = function(){
  addFolderName(key, 1);

  addSiblingfolderConnections();

  fs.writeFile(currentWorkingDirectory + '/' + outputFileName, markdownText, function(err){
    if (err) return;
  });
};

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

var addSiblingfolderConnections = function(){
  var lines = markdownText.split('\n');
  for(var i=1; i<lines.length; i++){
    var line1 = lines[i-1];
    var line2 = lines[i];
    for(var j=0; j<line2.length; j++){
      var char1 = line1.charAt(j);
      var char2 = line2.charAt(j);
      var foundSibling = false;
      for(var k=i; k<lines.length; k++){
        var charBelow = lines[k].charAt(j);
        if(charBelow !== '|' && charBelow !== ' '){
          break;
        }
        if(charBelow === '|'){
          foundSibling = true;
        }
      }
      if(foundSibling && char1 === '|' && char2 === ' '){
        line2 = line2.replaceAt(j, '|');
        lines[i] = line2;
      }
    }
  }
  markdownText = lines.join('\n');
};

folders[key] = {
  depth: searchPath.split('/').length - 1,
  parentFolder: null,
  path: searchPath,
  name: searchPath.split('/')[searchPath.split('/').length - 1],
  folders: [],
  files: [],
  logged: false,
  parsed: false,
  marked: false
};
fs.readdir(searchPath, function(err, list){
list.forEach(function(item){
    if (isContains(item)){
      if(!fs.lstatSync(searchPath + '/' + item).isDirectory()){
        if(folders[key].files.indexOf(item) === -1){
          folders[key].files.push(item);
        }
      }
    }
  });
  folders[key].parsed = true;
});
getFolders(searchPath);
