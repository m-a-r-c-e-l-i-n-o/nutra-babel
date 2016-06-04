import Fs from 'fs'
import Path from 'path'
import Babel from 'babel-core'

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
        sourceMapTarget: null,
        presets: ['es2016']
    })
    events.onLoad = () => {}
    events.onFileLoad = (source, filename) => {
        const tmpFilename = Path.join(
            system.tmpDirectory,
            system.helper.getFileKey(filename)
        )
        babelConfig.sourceFileName = filename
        babelConfig.sourceMapTarget = tmpFilename
        const transpiled = Babel.transform(source, babelConfig)
        Fs.writeFileSync(tmpFilename, transpiled.code)
        return {
            filename: tmpFilename,
            source: transpiled.code
        }
    }
    events.onExit = () => {}
}

export { preprocessor }
