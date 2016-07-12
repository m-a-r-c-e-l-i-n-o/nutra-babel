import Fs from 'fs-extra'
import Path from 'path'
import * as Babel from 'babel-core';

const preprocessor = (events, system, opts) => {
    let babelConfig = {}
    if (typeof opts.configFile === 'string') {
        try {
            babelConfig = JSON.parse(
                Fs.readFileSync(
                    Path.join(process.cwd(), opts.configFile), {
                        encoding: 'utf8',
                        flag: 'r'
                    }
                )
            )
        } catch (e) {system.handleError(e)}
    }
    babelConfig = Object.assign(babelConfig, {
        sourceMaps: 'both',
        sourceFileName: null,
        sourceMapTarget: null
    })
    events.onLoad = () => {}
    events.onFileLoad = (source, filename, key) => {
        const tmpFilename = Path.join(
            system.tmpDirectory,
            'babel',
            system.helper.getFileKey(filename)
        )
        babelConfig.sourceFileName = filename
        babelConfig.sourceMapTarget = tmpFilename
        const transpiled = Babel.transform(source, babelConfig)
        return {
            filename: tmpFilename,
            source: transpiled.code,
            key: key
        }
    }
    events.onExit = () => {}
}

export { preprocessor }
