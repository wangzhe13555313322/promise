const PENDING = 'pending'
const SUCCESS = 'fulfilled'
const FAIL = 'rejected'
class Promise {

    constructor (exe) {

        this.status = PENDING
        this.value = undefined
        this.reason = undefined
        this.resolveCallbacks = []
        this.rejectCallbacks = []

        const resolve = value => {
            if (value instanceof Promise) {
                return value.then(resolve, reject)
            }
            if (this.status === PENDING) {
                this.status = SUCCESS
                this.value = value
                this.resolveCallbacks.forEach(fn => fn)
            }
        }

        const reject = reason => {
            if (this.status === PENDING) {
                this.status = FAIL
                this.reason = reason
                this.rejectCallbacks.forEach(fn => fn())
            }
        }

        try {
            exe(resolve, reject)
        } catch (e) {
            reject(e)
        }
    }

    then (onFulfilled, onReject) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val
        onReject = typeof onReject === 'function' ? onReject : err => { throw  err}
        let promise = new Promise((resolve, reject) => {
            if (this.status === SUCCESS) {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value)
                        resolveParam(x)
                    } catch (e) {
                        reject(e)
                    }
                })
            }
            if (this.status === FAIL) {
                setTimeout(() => {
                    try {
                       let x = onReject(this.reason)
                        resolveParam(x)
                    } catch (e) {
                        reject(e)
                    }
                })
            }
            if (this.status === PENDING) {
                this.resolveCallbacks.push(() => {
                    let x = onFulfilled(this.value)
                    resolveParam(x)
                })
                this.rejectCallbacks.push(() => {
                    let x = onReject(this.reason)
                    resolveParam(x)
                })
            }
        })

        return promise
    }

    catch (callback) {
        return this.then(null, callback)
    }

    finally (callback) {
        return this.then(data => {
            return Promise.resolve(callback()).then(() => data)
        }, err => {
            return Promise.resolve(callback()).then(() => { throw err })
        })
    }
}

const resolveParam = (promise, x, resolve, reject) => {
    if (promise === x) {
        return reject(new TypeError('TypeError: Chaining cycle detected for promise #<Promise>'))
    }
    if (typeof x === 'function' || (typeof x === 'object' && x !== null)) {
        let called = false
        let then = x.then
        try {
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) return
                    called = true
                    resolveParam(promise, y, resolve, reject)
                }, err => {
                    if (called) return
                    called = true
                    reject(err)
                })
            } else {
                resolve(x)
            }
        } catch (e) {
            if (called) return
            called = true
            reject(e)
        }
    } else {
        resolve(x)
    }
}

Promise.resolve = value => new Promise(resolve => resolve(value))

Promise.race = arr => {
    return new Promise((resolve, reject) => {
        arr.forEach(promise => {
            promise.then(resolve, reject)
        })
    })
}

Promise.all = arr => {
    return new Promise((resolve, reject)  => {
        let index = 0
        let array = []
        const judge = (value, key) => {
            array[key] = value
            if (++index === arr.length) {
                resolve(array)
            }
        }
        arr.forEach((promise, index) => {
            if (judgePromise(promise)) {
                promise.then(x => {
                    judge(x, index)
                }, err => {
                    reject(err)
                })
            } else {
                judge(promise, index)
            }
        })
    })
}

const judgePromise = promise => {
    if (typeof promise === 'function' || (typeof promise === 'object' && promise !== null)) {
        let then = promise.then
        if (typeof then === 'function') {
            return true
        }
    }
    return false
}

// 将一个成功的promise失败状态
let p = new Promise(resolve => {
    setTimeout(() => {
        resolve
    }, 5000)
})

const wrap = fun => {
    let about
    let newPromise = new Promise((resolve, reject) => {
        about = reject
    })
    let p = Promise.race([newPromise, fun])
    p.about = about
    return p
}
let p1 = wrap(p)
setTimeout(() => {
    p1.about('error------')
}, 2000)
// module.exports = Promise
