const rp = require("request-promise");
const queries = require("./queries");
const _ = require("lodash");

const randomSample = (data, q) => _.shuffle(
    data.facets
        .filter(({name}) => name.indexOf("EN") < 0)
        .map(facet => facet.values
            .map(facetValue => ({
                name: facet.name,
                value: facetValue.replace(/\([0-9]+\)$/, "").trim(),
                count: facetValue.replace(/^.*\(([0-9]+)\)$/, "$1"),
            })))
        .reduce((a, b) => a.concat(b))
        .filter(facet => facet.value.toLowerCase().indexOf(q) > -1)
    ).slice(0, 3)
    .map(facet => ({
        title: facet.value,
        payload: `GVN|${facet.name}|${facet.value}|${facet.count}`
    }));

const search = (q, {onSuccess, onError}) => {

    queries
        .query(null, `${process.env['GVN_URL']}/results?maxperpage=0&coll=ngvn`)
        .then((data) => {
            if (data && data.facets) {
                const result = randomSample(data, q);
                if (result.length > 0) {
                    setTimeout(() =>
                        onSuccess(null, {type: "buttons", buttons: {text: "Welk onderwerp wil je hebben?", data: result}}),
                        1000
                    );
                } else {
                    onError()
                }
            } else {
                onError();
            }
        }).catch(onError);
};

const imageByDidl = (result, callback) => {

    queries
        .query(null, `${process.env['GVN_URL']}/resource?coll=ngvn&identifier=` +
            `${encodeURIComponent(result.recordIdentifier)}&type=didl`)
        .then((data) => {
            console.log(JSON.stringify(data, null, 2));
            if (data.resourceList && data.resourceList.images &&
                data.resourceList.images.length > 0 && data.resourceList.images[0].image.length > 0 &&
                data.resourceList.images[0].image[data.resourceList.images[0].image.length - 1].src
            ) {
                callback(data.resourceList.images[0].image[data.resourceList.images[0].image.length - 1].src)
            } else {
                callback();
            }
        })
        .catch(() => callback());
};

const imageByFacet = (facet, callback) => {
    const [x, facetName, facetValue, facetCount] = facet.split("|");
    const page = _.random(1, facetCount);

    queries
        .query(null, `${process.env['GVN_URL']}/results?maxperpage=1&page=${page}&coll=ngvn` +
            `&facets[${encodeURIComponent(facetName)}][]=${encodeURIComponent(facetValue)}`)
        .then((data) => {
            if(data.diag || !data.records || data.records.length === 0) {
                callback("Geen beeld gevonden");
            } else {
                const [ result ]= data.records;
                const title = typeof result.title === 'string' ? result.title : result.title[0];
                imageByDidl(result, (biggerImageUrl = null) => callback(null, {
                    type: "images",
                    images: {
                        image: biggerImageUrl || result.thumbnail,
                        label: title,
                        description: result.creator || "",
                        subjectName: "dit onderwerp",
                        author: facet,
                        collection: result.institutionString,
                        url: `http://geheugenvannederland.nl/nl/geheugen/view?identifier=${encodeURIComponent(result.recordIdentifier)}`
                    }
                }));
            }
        })
        .catch(() => callback("Geen beeld gevonden"));
};

module.exports = { search, imageByFacet };