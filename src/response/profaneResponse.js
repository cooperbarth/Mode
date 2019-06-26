const profaneResponse = (word, phrase) => {
    console.log(`Blocked word "${word}" from being searched in phrase "${phrase}".`);
    return "Your query has been flagged as inappropriate. Aborting search.";
}