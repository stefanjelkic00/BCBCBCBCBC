/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

var fs = require('fs-extra');

var configFile = process.argv[2] || './dw.json';
var siteImportName = 'site_compiled';
var sourceImport = __dirname.toString() + '/../sites/site_alias';
var targetImport = __dirname.toString() + '/../sites/' + siteImportName;
var targetAliasFile = __dirname.toString() + '/../sites/' + siteImportName + '/sites/RefArch/urls/aliases';
var archiver = require('archiver');

var config = {};

if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile));
    if (!config.hostname) {
        console.error('No Hostname in dw.json');
    }

    fs.copy(sourceImport, targetImport, function (err) {
        if (!err) {
            var aliasJson = fs.readJsonSync(targetAliasFile);
            aliasJson.settings['http-host'] = config.hostname;
            aliasJson.settings['https-host'] = config.hostname;
            fs.writeFileSync(targetAliasFile, JSON.stringify(aliasJson, null, 2));

            var archive = archiver('zip', { zlib: { level: 9 } });
            var output = fs.createWriteStream(siteImportName + '.zip');
            archive.directory(targetImport, siteImportName)
                .on('error', function (err) { console.error(err); })
                .pipe(output);

            output.on('close', function () {
                fs.removeSync(targetImport);
            });

            archive.finalize();
        } else {
            console.error(err);
        }
    });
} else {
    console.error('No Config File Found');
}

