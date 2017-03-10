    // http://geheugenvannederland.nl/nl/api/results?query=&page=1&maxperpage=0&coll=ngvn
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
        .query(null, 'http://geheugenvannederland.nl/nl/api/results?maxperpage=0&coll=ngvn')
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

// http://geheugenvannederland.nl/nl/api/resource?coll=ngvn&identifier=RAA01%3A101&type=didl

const imageByDidl = (result, callback) => {

    queries
        .query(null, `http://geheugenvannederland.nl/nl/api/resource?coll=ngvn&identifier=` +
            `${encodeURIComponent(result.recordIdentifier)}&type=didl`)
        .then((data) => {
            if (data.resourceList && data.resourceList.images &&
                data.resourceList.images.length > 0 && data.resourceList.images[0].image.length > 0 &&
                data.resourceList.images[0].image[0].src
            ) {
                callback(data.resourceList.images[0].image[0].src)
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
        .query(null, `http://geheugenvannederland.nl/nl/api/results?maxperpage=1&page=${page}&coll=ngvn` +
            `&facets[${encodeURIComponent(facetName)}][]=${encodeURIComponent(facetValue)}`)
        .then((data) => {
            if(data.diag || !data.records || data.records.length === 0) {
                callback("Geen beeld gevonden");
            } else {
                const [ result ]= data.records;
                console.log(JSON.stringify(result, null, 2));
                const title = typeof result.title === 'string' ? result.title : result.title[0];
                console.log(title);


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
/*
    console.log(facetName, facetValue, facetCount);
*/
};

module.exports = { search, imageByFacet };