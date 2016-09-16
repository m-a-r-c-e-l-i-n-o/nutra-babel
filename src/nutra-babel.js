import fs from 'fs-extra'
import path from 'path'
import inlineSourceMapComment from 'inline-source-map-comment'
import * as babel from 'babel-core'


const preprocessor = (events, system, opts) => {
    let babelConfig = {}
    if (typeof opts.configFile === 'string') {
        try {
            babelConfig = JSON.parse(
                fs.readFileSync(
                    path.join(process.cwd(), opts.configFile), {
                        encoding: 'utf8',
                        flag: 'r'
                    }
                )
            )
        } catch (e) {system.handleError(e)}
    }
    babelConfig = Object.assign(babelConfig, {
        sourceMaps: true,
        sourceFileName: null,
        sourceMapTarget: null
    })
    events.onLoad = () => {}
    events.onFileLoad = (source, filename, key) => {
        const tmpFilename = path.join(system.tmpDirectory, 'babel', key)
        babelConfig.sourceFileName = filename
        babelConfig.sourceMapTarget = tmpFilename

        const transpiled = babel.transform(source, babelConfig)
        const sourceMapComment = inlineSourceMapComment(transpiled.map)
        const sourceWithMap = transpiled.code + '\n' + sourceMapComment

        fs.ensureFileSync(tmpFilename)
        fs.writeFileSync(tmpFilename, sourceWithMap)

        return {
            filename: tmpFilename,
            source: transpiled.code,
            key: key
        }
    }
    events.onExit = () => {}
}

export { preprocessor }
