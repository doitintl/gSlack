const Datastore = require('@google-cloud/datastore');
const Slack = require('slack-node');
const base64 = require('base-64');

exports.pubsubLogSink = function (event, callback) {
    console.log(`Function input: ${JSON.stringify(event)}`);
    let data = JSON.parse(base64.decode(event.data.data));
    console.log(`Data: ${JSON.stringify(data)}`);

    getConfig()
        .then(config => {
            console.log(`Config: ${JSON.stringify(config)}`);
            return sendSlack(config.slackChannel, 'Test Message', config.slackAPIToken);
        })
        .then(() => {
            callback();
        });
};

function getConfig() {
    const ds = Datastore();
    const query = ds.createQuery(['Config']);
    return runDSQuery(ds,query).then(configsArray => {
        return configsArray.reduce((configs, config) => {
            configs[config.name] = config.value;
            return configs;
        }, {});
    });
}

function runDSQuery(ds,query) {
    return new Promise((resolve, reject) => {
        ds.runQuery(query, (err, entities, nextQuery) => {
            if (err) {
                reject(err);
            }
            const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
            if (hasMore) {
                runDSQuery(ds,nextQuery).then(moreEntities => {
                    resolve(entities.concat(moreEntities));
                });
            }
            else {
                resolve(entities);
            }
        });
    });
}

function sendSlack(channel, message, apiToken) {
    return new Promise((resolve, reject) => {
        const slack = new Slack(apiToken);
        slack.api('chat.postMessage', {
            text: message,
            channel: channel
        }, function (err, response) {
            if (!!err) {
                reject(err);
            }
            else {
                resolve(response);
            }
        });
    });
}