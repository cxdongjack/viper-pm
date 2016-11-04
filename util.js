// global
require('shelljs/global');

var repo = readJSON(__dirname + '/repos.json');
var PWD = pwd();
var VIPER_MODULES = `.viper_modules`;
var MODULE_HOME = `src/module`;
var MODULE_GIT = 'git@git.n.xiaomi.com:duokan-fe';

exports.VIPER_MODULES = VIPER_MODULES;
exports.MODULE_HOME = MODULE_HOME;
exports.localDir = localDir;
exports.remoteDir = remoteDir;
exports.modules = modules;
exports.clone = clone;
exports.sync = sync;
exports.conf = conf;
exports.clear = clear;
exports.updateConf = updateConf;
exports.spawn = spawn;
exports.gitHEAD = gitHEAD;

function clone(module, hash) {
    var gitRepo = getRepos(module);
    var path = `${VIPER_MODULES}/${module}`;
    // clone
    exec(`git clone ${hash ? '' : '--depth 1'} ${gitRepo} ${path}`);
    // reset to rev
    if (hash && hash !== true) {
        exec(`cd ${path};git reset --hard ${hash}`)
    }
}

function conf(modules, configPath) {
    var CONFIG = configPath || `${PWD}/package.json`;
    var json = readJSON(CONFIG);
    if (modules) {
        json.viper_modules = modules;
        ShellString(JSON.stringify(json, 1, 2)).to(CONFIG);
    }
    return json.viper_modules;
}

function updateConf(module, revision, configPath) {
    var pkgs = conf('', configPath);
    replace(pkgs, module, revision);
    conf(pkgs, configPath);
}

function modules(modules) {
    return modules.map(function(module) {
        var tuple = module.split('@');
        return {
            name : tuple[0],
            hash : tuple[1]
        };
    });
}

function sync(remote, local) {
    rm('-rf', local);
    cp('-rf', remote, local);
}

function localDir(module) {
    return `${PWD}/${MODULE_HOME}/${module}`;
}

function remoteDir(module) {
    return `${PWD}/${VIPER_MODULES}/${module}/${MODULE_HOME}/${module}`;
}

function spawn(cmd) {
    // http://stackoverflow.com/questions/9122282/how-do-i-open-a-terminal-application-from-node-js
    var child_process = require('child_process');
    var cmds = cmd.split(' ');
    return child_process.spawnSync(cmds[0], cmds.slice(1), {
        stdio: 'inherit'
    });
}

function gitHEAD(module, size) {
    return exec(`cd ${remoteDir(module)};git rev-parse HEAD`).substr(0, size || 8);
}



// test
if (process.argv[2] == '__test') {
    echo('>>> test start');
    const assert = require('assert');
    // modules
    assert.deepEqual(modules(['a@1', 'b@2']), [{name:'a',hash:'1'},{name:'b',hash:'2'}]);
    // conf
    conf(['lib']);
    assert.deepEqual(conf(), ['lib']);
    conf(['lib@1']);
    assert.deepEqual(conf(), ['lib@1']);
    conf(['lib']);
    // replace
    assert.deepEqual(replace(['a'], 'a', '1'), ['a@1']);
    // localDir
    assert.deepEqual(localDir('lib'), `${PWD}/${MODULE_HOME}/lib`);
    // remoteDir
    assert.deepEqual(remoteDir('lib'), `${PWD}/${VIPER_MODULES}/lib/${MODULE_HOME}/lib`);
}

// helper
function replace(array, item, revision) {
    var index = clear(array).indexOf(item);
    if (index === -1) {
        return array;
    }
    array[index] = `${item}@${revision}`;
    return array;
}

function clear(array) {
    return array.map(function(item) {
        return item.replace(/@[\s\S]*/, '');
    });
}

function getRepos(module) {
    var repos = repo[module];
    if (!repos) {
        repos = `${MODULE_GIT}/${module}.git`;
    }
    echo('----->', repos)
    return repos;
};

function readJSON(filepath) {
    return JSON.parse(cat(filepath));
}

