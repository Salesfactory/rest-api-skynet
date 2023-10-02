const debug = process.env.NODE_ENV === 'development';
const { User } = require('../models');

const validateUUID = uuid => {
    const regexExp =
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(uuid);
};

const getUser = async res => {
    const { username: uid } = res.locals.user;
    return await Promise.resolve(User.findOne({ where: { uid } }));
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
                message: 'Missing budget, percentage or allocations',
            };
        }

        if (Array.isArray(obj[key].allocations)) {
            const { validation, message } = validateAllocations(
                obj[key].allocations
            );
            if (!validation) {
                return {
                    validation: false,
                    message: 'Invalid allocations: ' + message,
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
        return {
            validation: false,
            message: 'Invalid allocations',
        };
    }

    const requiredProperties = ['id', 'name', 'budget', 'percentage', 'type'];

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
            const missingProperties = requiredProperties.filter(
                prop => !allocation.hasOwnProperty(prop)
            );
            if (debug) {
                console.log(
                    `Missing or invalid: [${missingProperties.join(
                        ', '
                    )}] in allocation`
                );
            }
            return {
                validation: false,
                message: `Missing or invalid: [${missingProperties.join(
                    ', '
                )}] in allocation`,
            };
        }

        if (Array.isArray(allocation.allocations)) {
            if (allocation.allocations.length > 0) {
                const { validation, message } = validateAllocations(
                    allocation.allocations,
                    level + 1
                );
                if (!validation) {
                    return {
                        validation: false,
                        message: message,
                    };
                }
            }
        } else if (allocation.allocations) {
            if (debug)
                console.log(
                    'allocations property is not an array',
                    allocation.allocations
                );
            return {
                validation: false,
                message: 'allocations property is not an array or is not null',
            };
        }
    }

    return {
        validation: true,
        message: 'Valid allocations',
    };
}

// this function is used to check if a campaign is in flight based on the flight time start and end
const checkInFlight = ({ currentDate, campaign }) => {
    const startPeriod = new Date(campaign.flight_time_start);
    const endPeriod = new Date(campaign.flight_time_end);
    // Set the endPeriod to the last day of the month
    endPeriod.setMonth(endPeriod.getMonth() + 1);
    endPeriod.setDate(0);

    return {
        inFlight:
            currentDate >= startPeriod && currentDate <= endPeriod
                ? true
                : false,
        hasEnded: currentDate > endPeriod ? true : false,
    };
};

module.exports = {
    validateUUID,
    getUser,
    validateObjectAllocations,
    checkInFlight,
};
