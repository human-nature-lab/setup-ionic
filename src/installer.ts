import * as child from 'child_process'
import * as path from 'path'
import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'

/**
 * Install Cordova Cli
 *
 * https://www.npmjs.com/package/cordova
 *
 * @param version
 */
export async function installCordova(version?: string): Promise<void> {
  await installNpmPkg('cordova', version)

  // install cordova-res
  // https://github.com/ionic-team/cordova-res
  // await installNpmPkg('cordova-res');

  // Fix access permissions
  await exec2(`sudo chown -R $USER:$GROUP ~/.npm`)
  await exec2(`sudo chown -R $USER:$GROUP ~/.config`)
}

/**
 * Install Ionic Cli
 *
 * https://www.npmjs.com/package/@ionic/cli
 */
export async function installIonic(version?: string): Promise<void> {
  await installNpmPkg('@ionic/cli', version)
}

/**
 * Install Java
 *
 */
export async function installJava(): Promise<void> {
  if (process.platform === 'linux') {
    await exec2(path.join(__dirname, 'install-openjdk-8'))
  }
}

/**
 * Install CocoaPods
 *
 */
export async function installPods(): Promise<void> {
  if (process.platform === 'darwin') {
    await exec2(`sudo gem install cocoapods`)
  }
}

/**
 * Logs installed information
 *
 */
export async function logInstalledInfo(): Promise<void> {
  core.info('Cordova/Ionic environment has been setup successfully.')

  core.info((await exec2('ionic info')) as string)
  core.info(`Cordova: ${await exec2('cordova -v')}`)
}

/**
 * Install NPM Package
 *
 * @param pkg     : name of package
 * @param version : version
 */
export async function installNpmPkg(
  pkg: string,
  version?: string
): Promise<void> {
  // attach cached package
  if (version) {
    const packageDir = tc.find(pkg, version)
    if (packageDir) {
      core.addPath(packageDir)
      return
    }
  }

  // install npm package
  await exec2(`sudo npm install -g ${pkg}${version ? `@${version}` : ''}`)

  let installedPath = (await exec2(`echo $(npm root -g)/${pkg}`)) as string
  if (!installedPath) {
    return
  }

  // remove linebreak in the command
  installedPath = installedPath.replace(/(\r\n|\n|\r)/gm, '')

  if (!version) {
    // installed version
    version = (await exec2(
      `node -p "require('${installedPath}/package.json').version"`
    )) as string

    // cache installed package
    const cachedPath = await tc.cacheDir(installedPath, pkg, version)
    core.addPath(cachedPath)
  }
}

async function exec2(command: string): Promise<any> {
  return new Promise((resolve, reject) => {
    child.exec(command, (err: any, stdout: any, stderr: any) => {
      if (stderr) {
        resolve(stdout)
      }

      if (err) {
        core.setFailed(JSON.stringify(err))
        reject(err)
      }

      resolve(stdout)
    })
  })
}
