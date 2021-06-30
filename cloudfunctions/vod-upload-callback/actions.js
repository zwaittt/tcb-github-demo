const { yunApiRequest } = require('./lib');
const config = require('./config');
exports.ads10 = async function(fileId) {
    return yunApiRequest({
        Action: 'ProcessMedia',
        FileId: fileId,
        SubAppId: 1400232770,
        MediaProcessTask: {
            AdaptiveDynamicStreamingTaskSet: [{
                Definition: 10,
                WatermarkSet: [{Definition:0}]
            }],
            CoverBySnapshotTaskSet: [{
                Definition: 10,
                PositionType: "Time",
                PositionValue: 0
            }]
        },
    }, config);
}