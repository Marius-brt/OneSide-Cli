const chalk = require("chalk");
const fs = require("fs");
const proc = require("child_process");
const emptyDir = require("empty-dir");
const download = require("download");
const shell = require("shelljs");
const { get } = require("https");

export function cli(args, path, cmd) {
  if (args.length > 2) {
    try {
      get("https://registry.npmjs.org/oneside-cli/latest", (resp) => {
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
        });
        resp.on("end", () => {
          const version = require("./package.json").version;
          const latest = JSON.parse(data).version;
          if (version !== latest) {
            console.log(
              chalk.cyan(
                `?> New version of OneSide Cli available ${version}->${latest}. Use the "npm i -g oneside-cli@latest" command to install the latest version available.`
              )
            );
          }
          cliExec(args, path);
        });
        resp.on("error", () => {
          cliExec(args, path);
        });
      });
    } catch (ex) {
      cliExec(args, path);
    }
  }
}

function cliExec(args, path) {
  switch (args[2].toLowerCase()) {
    case "-i":
    case "init":
      require("dns").lookup("google.com", (err) => {
        if (err && err.code == "ENOTFOUND") {
          console.log(chalk.red("> You are not connected to the internet !"));
        } else {
          var folder =
            args.length > 3 ? args[3].replace(/[`'"]+/g, "") : "NewProject";
          var dlPath = `${path}/${folder}`;
          if (!fs.existsSync(dlPath)) {
            console.log(chalk.green(`> Downloading...`));
            download(
              "https://github.com/Marius-brt/OneSide-Default-Project/archive/refs/heads/main.zip",
              path,
              {
                extract: true,
              }
            ).then(() => {
              fs.rename(
                `${path}/OneSide-Default-Project-main`,
                `${path}/${folder}`,
                () => {
                  var pkg = fs.readFileSync(
                    `${path}/${folder}/package.json`,
                    "utf-8"
                  );
                  if (pkg != "") {
                    pkg = JSON.parse(pkg);
                    pkg.name = folder.replace(/\s+/g, "-").toLowerCase();
                    fs.writeFileSync(
                      `${path}/${folder}/package.json`,
                      JSON.stringify(pkg, null, 2)
                    );
                  }
                  shell.cd(dlPath);
                  console.log(chalk.green(`> Installation of dependencies...`));
                  shell.exec(`npm i`, { silent: true }, (code) => {
                    if (code != 0)
                      return console.log(
                        chalk.red("Error when installing dependencies !")
                      );
                    console.log(
                      chalk.green("> Installation completed. Happy coding !")
                    );
                    console.log(
                      "To run your project, navigate to the directory and run the commands :"
                    );
                    console.log(chalk.gray(`- cd ${folder}\n- oneside start`));
                  });
                }
              );
            });
          } else {
            if (!emptyDir.sync(dlPath))
              return console.log(
                chalk.red(`> The directory '${folder}' is not empty !`)
              );
          }
        }
      });
      break;
    case "-s":
    case "start":
      startServer(path);
      break;
    case "-v":
    case "--version":
      const version = require("./package.json");
      console.log(chalk.green(`> OneSide Cli version ${version.version}`));
      break;
    case "-h":
    case "help":
      console.log("\nOptions :");
      console.log(chalk.green("-h, help           ") + "Show help.");
      console.log(chalk.green("-i, init <name>    ") + "Create new project.");
      console.log(chalk.green("-s, start          ") + "Start dev server.");
      console.log(
        chalk.green("-v, --version      ") + "Get the OneSide Cli version."
      );
      break;
  }
}

function startServer(cwd, restart = false) {
  let main = "index.js";
  if (fs.existsSync(`${cwd}/package.json`)) {
    main = require(`${cwd}/package.json`).main || "index.js";
  }
  if (fs.existsSync(`${cwd}/${main}`)) {
    const cur_proc = proc.fork(`${cwd}/${main}`, [
      "dev",
      restart ? "restart" : "first",
    ]);
    cur_proc.on("message", (data) => {
      if (data == "restart") {
        cur_proc.kill();
        console.clear();
        startServer(cwd, true);
      }
    });
  } else {
    console.log(chalk.red("> Server main file not found !"));
  }
}

function exist(obj, path) {
  path = path.split(".");
  var exist = true;
  path.forEach((el) => {
    if (typeof obj[el] == "undefined") exist = false;
    else obj = obj[el];
  });
  return exist;
}
