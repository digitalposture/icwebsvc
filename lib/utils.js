

const capValue = (value, defValue, topValue) => {
    try{
        let topN = parseInt(value, 10);
        if (isNaN(topN) || topN <= 0) {
            topN = defValue; // default value
        }

        // Cap the value to MAX_TOPN
        topN = Math.min(topN, topValue);
        return topN;
    }catch(ex){
        return useDeferredValue;
    }
}

module.exports = {
  capValue
};