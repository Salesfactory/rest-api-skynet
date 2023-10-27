const CognitoExpress = require('cognito-express');
const { Permission, Role, User } = require('../models');

let cognitoExpress;
if (process.env.NODE_ENV !== 'test') {
    cognitoExpress = new CognitoExpress({
        region: process.env.COGNITO_REGION,
        cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: 'access',
        tokenExpiration: 3600000,
    });
}

const validateToken = (req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        const authorization = req.headers.authorization;
        const accessTokenFromClient = authorization
            ? authorization.split(' ')[1]
            : null;

        if (!accessTokenFromClient)
            return res.status(401).json({ message: 'Access Token missing' });

        cognitoExpress.validate(accessTokenFromClient, (err, response) => {
            if (err) return res.status(401).json({ message: err.message });

            res.locals.user = response;
            next();
        });
    } else {
        next();
    }
};

const hasRole = role => async (req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        const { user: userSession } = res.locals;

        if (!userSession)
            return res.status(401).json({ message: 'Access Token missing' });

        // find user in database
        const user = await User.findOne({
            where: { uid: userSession.username },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name'],
                    as: 'role',
                },
            ],
        });

        // might cause some trouble since not all users are actaully register in our db
        // this line is included to force us to migrate these users into our db
        // once they complain about not being able to access the app
        if (!user)
            return res.status(404).json({
                message: 'User not found in database',
            });

        // check if role exist
        const roles = await Role.findAll({
            where: { name: role },
        });

        // if role sent in parameters is not in the database
        if (roles.length !== 1) {
            return res.status(403).json({
                message: 'Route role is not accurate',
            });
        }

        // check if user has role
        if (roles) {
            const userRole = user.role.name;

            if (userRole !== role)
                return res.status(403).json({
                    message: 'You do not have the role to perform this action',
                });
        } else {
            return res.status(403).json({
                message: 'Route role not found',
            });
        }

        next();
    } else {
        next();
    }
};

const hasPermissions = perms => async (req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        const { user: userSession } = res.locals;

        if (!userSession)
            return res.status(401).json({ message: 'Access Token missing' });

        // find user in database
        const user = await User.findOne({
            where: { uid: userSession.username },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name'],
                    as: 'role',
                    include: [
                        {
                            model: Permission,
                            attributes: ['id', 'name'],
                            as: 'permissions',
                            through: { attributes: [] },
                        },
                    ],
                },
            ],
        });

        // might cause some trouble since not all users are actaully register in our db
        // this line is included to force us to migrate these users into our db
        // once they complain about not being able to access the app
        if (!user)
            return res.status(404).json({
                message: 'User not found in database',
            });

        // check if permissions exist
        const permissions = await Permission.findAll({
            where: { name: perms },
        });

        // if at least one of the permissions sent in parameters are not in the database
        if (permissions.length !== perms.length) {
            return res.status(403).json({
                message: 'Route permissions are not accurate',
            });
        }

        // check if user has permissions
        if (permissions) {
            const userPermissions = user.role.permissions.map(
                permission => permission.name
            );

            const hasPermission = perms.some(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission)
                return res.status(403).json({
                    message:
                        'You do not have permission/s to perform this action',
                });
        } else {
            return res.status(403).json({
                message: 'Route permissions not found',
            });
        }

        next();
    } else {
        next();
    }
};

module.exports = {
    validateToken,
    hasRole,
    hasPermissions,
};
