// global
require('shelljs/global');

var modules = process.argv.slice(2);

if (!modules.length) {
    modules = clear(moduleJSON());
}

if (!modules.length) {
    return exit(1);
}

var repo = readJSON(__dirname + '/repos.json');
var dist = '.viper_modules';

modules.forEach(function(module) {
    var gitRepo = repo[module];
    if (!gitRepo) {
        return echo(`{${module}} not exist, skip it.`);
    }
    var revision = install(module, gitRepo);
    moduleJSON(module, revision);
});

rm('-rf', dist);

// helper
function install(module, gitRepo) {
    var modulePath = `src/module/${module}`;
    var distDir = `${dist}/${module}`;

    exec(`git clone --depth 1 ${gitRepo} ${dist}/${module}`)
    mkdir('-p', `src/module`);
    rm('-rf', modulePath);
    cp('-rf', `${distDir}/${modulePath}`, modulePath);
    return exec(`cd ${distDir};git rev-parse HEAD`).substr(0, 8);
}

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

function moduleJSON(item, revision) {
    var CONFIG = 'package.json';
    var json = readJSON(CONFIG);
    var modules = json.viper_modules || [];
    if (item && revision) {
        json.viper_modules = replace(modules, item, revision);
        ShellString(JSON.stringify(json, 1, 2)).to(CONFIG);
    }
    return json.viper_modules;
}

function readJSON(filepath) {
    return JSON.parse(cat(filepath));
}
