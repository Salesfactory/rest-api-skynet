const debug = process.env.NODE_ENV === 'development';

const validateUUID = uuid => {
    const regexExp =
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(uuid);
};

function validateObjectAllocations(obj, periods) {
    // verify if it is an object
    if (typeof obj !== 'object') {
        return {
            validation: false,
            message: 'Invalid object:' + JSON.stringify(obj),
        };
    }

    // verify if periods is an array
    if (!Array.isArray(periods)) {
        return {
            validation: false,
            message: 'Invalid periods:' + periods?.toString(),
        };
    }

    // verify if each of the keys of that object are in the periods array
    // and verify if each of the values of that object are actually objects
    for (const key of Object.keys(obj)) {
        if (!periods.includes(key) || typeof obj[key] !== 'object') {
            return {
                validation: false,
                message:
                    'Invalid object, not in periods array or not an object:' +
                    JSON.stringify(obj),
            };
        }
    }

    // iterate over each of the keys of the 'obj' object
    // validating that budget, percentage, allocations exist
    for (const key of Object.keys(obj)) {
        if (debug) console.log('Checking ', key);
        if (
            !obj[key].hasOwnProperty('budget') ||
            !obj[key].hasOwnProperty('percentage') ||
            !obj[key].hasOwnProperty('allocations')
        ) {
            return {
                validation: false,
                message:
                    'Missing budget, percentage or allocations:' +
                    JSON.stringify(obj),
            };
        }

        if (Array.isArray(obj[key].allocations)) {
            if (!validateAllocations(obj[key].allocations)) {
                return {
                    validation: false,
                    message:
                        'Invalid allocations: ' +
                        JSON.stringify(obj[key].allocations),
                };
            }
        }
    }

    return {
        validation: true,
        message: 'Valid object',
    };
}

function validateAllocations(allocations, level = 0) {
    if (!Array.isArray(allocations)) {
        if (debug) console.log('Invalid allocations:', allocations);
        return false;
    }

    const requiredProperties = [
        'id',
        'name',
        'budget',
        'percentage',
        'type',
        'allocations',
    ];

    for (const allocation of allocations) {
        if (debug)
            console.log(
                'level:',
                level,
                'allocation: [id: ' +
                    allocation.id +
                    ', name: ' +
                    allocation.name +
                    ']'
            );

        if (requiredProperties.some(prop => !allocation.hasOwnProperty(prop))) {
            if (debug) {
                const missingProperties = requiredProperties.filter(
                    prop => !allocation.hasOwnProperty(prop)
                );
                console.log(
                    `Missing or invalid: [${missingProperties.join(
                        ', '
                    )}] in allocation`
                );
            }
            return false;
        }

        if (Array.isArray(allocation.allocations)) {
            if (allocation.allocations.length > 0) {
                if (!validateAllocations(allocation.allocations, level + 1)) {
                    return false;
                }
            }
        } else {
            if (debug) console.log('allocations property is not an array');
            return false;
        }
    }

    return true;
}

module.exports = {
    validateUUID,
    validateObjectAllocations,
};
