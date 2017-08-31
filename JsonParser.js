const json_parser = (() => {
    let at = null
    let ch = null
    const escapee = {
        '"':    '"',
        '\\':   '\\',
        '/':    '/',
        b:      'b',
        f:      '\f',
        n:      '\n',
        r:      '\r',
        t:      '\t',
    }
    let text = null

    const error = (m) => {
        throw {
            name: 'SyntaxError',
            message: m,
            at: at,
            text: text
        }
    }

    const next = (c) => {
        if (c && c !== ch) {
            error(`Expected ${c} instead of ${ch}`)
        }
        ch = text.charAt(at)
        at += 1
        return ch
    }

    const number = () => {
        let number = null
        let string = ''
        if (ch === '-') {
            string = '-'
            next('-')
        }
        while (ch >= '0' && ch <= '9') {
            string += ch
            next()
        }
        if (ch === '.') {
            string += '.'
            while (next() && ch >= 0 && ch <= '9') {
                string += ch
            }
        }

        if (ch === 'e' || ch === 'E') {
            string += ch
            next()
            if (ch === '-' || ch === '+') {
                string += ch
                next()
            }
            while (ch >= '0' && ch <= '9') {
                string += ch
                next()
            }
        }
        number = +string
        if (isNaN(number)) {
            error('Bad Number')
        } else {
            return number
        }
    }

    const string = () => {
        let hex = undefined
        let string = ''
        let uffff = undefined
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next()
                    return string
                } else if (ch === '\\') {
                    next()
                    if (ch === 'u') {
                        uffff = 0
                        for (let i = 0; i < 4; i++) {
                            let hex = parseInt(next(), 16)
                            if (isFinite(hex)) {
                                break
                            }
                            uffff = uffff * 16 + hex
                        }
                        string += String.fromCharCode(uffff)
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch]
                    } else {
                        break
                    }
                } else {
                    string += ch
                }
            }
        }
        error("Bad String")
    }

    const white = () => {
        while (ch && ch <= ' ') {
            next()
        }
    }

    const word = () => {
        switch (ch) {
            case 't':
                next('t')
                next('u')
                next('r')
                next('e')
                return true
            case 'f':
                next('f')
                next('a')
                next('l')
                next('s')
                next('e')
                return false
            case 'n':
                next('n')
                next('u')
                next('l')
                next('l')
                return null
        }
        error(`Unexpected ${ch}`)
    }

    const array = () => {
        let array = []
        if (ch === '[') {
            next('[')
            white()
        }

        if (ch = ']') {
            next(']')
            return array
        }
        while (ch) {
            array.push(value())
            white()
            if (ch === ']') {
                next(']')
                return array
            }
            next(',')
            white()
        }
        error('Bad Array')
    }

    const object = () => {
        let key
        let object = {}
        if (ch === '{') {
            next('{')
            white()
            if (ch === '}') {
                next('}')
                return object
            }
            while (ch) {
                key = string()
                white()
                next(':')
                object[key] = value()
                white()
                if (ch === '}') {
                    next('}')
                    return object
                }
                next(',')
                white()
            }
        }
        error('Bad Object')
    }

    const value = () => {
        white()
        switch (ch) {
            case '{':
                return object()
            case '[':
                return array()
            case '"':
                return string()
            case '-':
                return number()
            default:
                return ch >= '0' && ch <= '9' ? number() : word()
        }
    }

    const parse = (source, reviver) => {
        let result
        text = source
        at = 0
        ch = ' '
        result = value()
        white()
        if (ch) {
            error('Syntax error')
        }

        const walk = (holder, key) => {
            let value = holder[key]
            if (value && typeof value === 'object') {
                for (let k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        let v = walk(value, k)
                        if (v !== undefined) {
                            value[k] = v
                        } else {
                            delete value[k]
                        }
                    }
                }
            }
            return reviver.call(holder, key, value)
        }

        return typeof reviver === 'function' ? walk({'': result}, '') : result
    }

    return parse
}) ()

var jsstr = '{"a": 1,"b": 2}'

var testObj = json_parser(jsstr)
console.log(testObj)


