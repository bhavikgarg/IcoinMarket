var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { console.log(stdout) }

// Creating Symlinks
exec('ln -s /home/ci/public_html/dis-client ./dist/client', puts);
exec('ln -s /home/ci/public_html/dis-client/assets/affiliates ./dist/public/assets/affiliates', puts);
exec('ln -s /home/ci/public_html/dis-client/assets/user ./dist/public/assets/user', puts);
  exec('ln -s /home/ci/ci-main/node_modules ./dist/node_modules', puts);
//exec('ln -s /home/ci/public_html/landing-pages ./dist/public/referrals', puts);
