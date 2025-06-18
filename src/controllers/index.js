exports.getResources = (req, res) => {
    res.send('GET all resources');
};

exports.createResource = (req, res) => {
    res.send('POST create resource');
};

exports.updateResource = (req, res) => {
    res.send(`PUT update resource ${req.params.id}`);
};

exports.deleteResource = (req, res) => {
    res.send(`DELETE resource ${req.params.id}`);
};