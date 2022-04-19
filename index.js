let isArray = Array.isArray
let isObject = v => typeof v === 'object' && v !== null
let keys = v => Object.keys(isArray(v) ? [...v] : v) // use spread to preserve holes in array

/**
 * Create immutable array or object.
 * @returns {Array|Object}
 **/
let mewt = module.exports = (parent, targetPath = []) => {
  let multiPurpose // we re-use this in order to reduce the number of let declarations

  let getOrSetTarget = (obj, value) => {
    multiPurpose = targetPath.length
    while (multiPurpose > (value ? 1 : 0)) {
      obj = obj[targetPath[--multiPurpose]]
    }
    if (!value) return obj
    obj[targetPath[--multiPurpose]] = value
  }

  let target = getOrSetTarget(parent)
  let parentClone

  let clone = (obj = parent) =>
    isObject(obj) ? keys(obj).reduce((newObj, key) => (
      multiPurpose = obj[key],
      newObj[key] = isArray(multiPurpose)
        ? multiPurpose.map(clone)
        : isObject(multiPurpose)
          ? clone(multiPurpose)
          : multiPurpose,
      /* return */newObj
    ), isArray(obj) ? [] : {}) : obj

  let mutationTrapError = () => {
    throw new Error(`${isArray(target) ? 'arr' : 'obj'} immutable`)
  }

  let override = prop => (...args) => {
    let mutMethod = /reverse|sort|splice|fill|copyWithin/.test(prop)
    let nonMutMethod = /filter|map|concat|slice/.test(prop)

    let cl = nonMutMethod ? parent : clone()
    let res = getOrSetTarget(cl)[prop](...args)

    // final result
    multiPurpose = mutMethod || nonMutMethod ? mewt(res) : res

    return /push|pop|shift|unshift/.test(prop)
      ? [multiPurpose, mewt(cl)] : multiPurpose
  }

  if (!isObject(parent)) {
    throw new Error('expect arr|obj')
  } else if (!target) {
    return target
  }

  if (!targetPath.length) {
    parent = keys(parent).reduce((newObj, key) => (
      newObj[key] = isObject(target[key])
        ? mewt(parent, [...targetPath, key])
        : target[key],
      /* return */newObj
    ), isArray(parent) ? [] : {})
  }

  return new Proxy(target, {
    get (_, prop) {
      multiPurpose = getOrSetTarget(parent)
      return {
        $set (prop, val) {
          parentClone = clone()
          multiPurpose = getOrSetTarget(parentClone)
          multiPurpose[prop] = val
          return mewt(parentClone)
        },
        $unset (prop) {
          parentClone = clone()
          if (isArray(target) && !(prop % 1) && prop >= 0) {
            multiPurpose = [
              ...parentClone.slice(0, prop),
              ...parentClone.slice(prop + 1)
            ]
            if (targetPath.length) {
              getOrSetTarget(parentClone, multiPurpose)
              return mewt(parentClone)
            }
            return mewt(multiPurpose)
          }
          delete getOrSetTarget(parentClone)[prop]
          return mewt(parentClone)
        }
      }[prop] || multiPurpose[prop] && ({}.hasOwnProperty.call(multiPurpose, prop) ? multiPurpose[prop] : override(prop))
    },
    defineProperty: mutationTrapError,
    deleteProperty: mutationTrapError,
    setPrototypeOf: mutationTrapError
  })
}


const funct = (ass) => {
  console.log(`${ass} likes that`)
}

funct();