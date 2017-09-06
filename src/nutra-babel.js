import { readFileSync, ensureFileSync, writeFileSync } from 'fs-extra'
import { join } from 'path'
import inlineSourceMapComment from 'inline-source-map-comment'
import * as babel from 'babel-core'

const resolveConfigFile = (configFile) => {
    if (typeof configFile !== 'string') return {}
    try {
        const settings = { encoding: 'utf8', flag: 'r' }
        const configFilePath = join(process.cwd(), configFile)
        const config = readFileSync(configFilePath, settings)
        return JSON.parse(config)
    } catch (e) {
        return e
    }
}

const resolveConfig = ({ configFile, ...opts }) => {
    if (typeof opts !== 'object') return {}
    const required = {
        sourceMaps: true,
        sourceFileName: null,
        sourceMapTarget: null
    }
    const config = resolveConfigFile(configFile)
    if (config instanceof Error) return config
    return Object.assign({}, config, opts, required)
}

const preprocessor = (events, system, opts) => {
    const babelConfig = resolveConfig(opts)
    if (babelConfig instanceof Error) return system.handleError(babelConfig)
    events.onLoad = () => {}
    events.onFileLoad = (source, filename, key) => {
        const tmpFilename = join(system.tmpDirectory, 'babel', key)
        babelConfig.sourceFileName = filename
        babelConfig.sourceMapTarget = tmpFilename

        const transpiled = babel.transform(source, babelConfig)
        const sourceMapComment = inlineSourceMapComment(transpiled.map)
        const sourceWithMap = transpiled.code + '\n' + sourceMapComment

        ensureFileSync(tmpFilename)
        writeFileSync(tmpFilename, sourceWithMap)

        return {
            filename: tmpFilename,
            source: sourceWithMap,
            key: key
        }
    }
    events.onExit = () => {}
}

export { preprocessor }
