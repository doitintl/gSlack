const base64 = require('base-64');
const Datastore = require('@google-cloud/datastore');

const ds = Datastore();

exports.pubsubLogSink = function (event, callback) {
    console.log(`Function input: ${JSON.stringify(event)}`);
    let data = JSON.parse(base64.decode(event.data.data));
    console.log(`Data: ${JSON.stringify(data)}`);

    getConfig().then(config => {
        console.log(`Config: ${JSON.stringify(config)}`);
        callback();
    });
};

function getConfig() {
    const query = ds.createQuery(['Config']);
    return runDSQuery(query).then(configsArray => {
        return configsArray.reduce((configs, config) => {
            configs[config.name] = config.value;
            return configs;
        }, {});
    });
}

function runDSQuery(query) {
    return new Promise((resolve, reject) => {
        ds.runQuery(query, (err, entities, nextQuery) => {
            if (err) {
                reject(err);
            }
            const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
            if (hasMore) {
                runDSQuery(nextQuery).then(moreEntities => {
                    resolve(entities.concat(moreEntities));
                });
            }
            else {
                resolve(entities);
            }
        });
    });
}
