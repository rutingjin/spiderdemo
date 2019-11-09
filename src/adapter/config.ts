module.exports = {
    originUri: {
        direct: [
            {
                name: 'youneed',
                uri: 'https://www.youneed.win/free-ssr',
                requestConfig: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
                    }
                }
            },
            {
                name: 'onessr',
                uri: 'https://onessr.ml/articles/getArticles'
            },
        ],
        proxy: [
            {
                name: 'ssrtool',
                uri: 'https://www.ssrtool.com/tool/free_ssr'
            },
            {
                name: 'lncn',
                uri: 'https://lncn.org/api/lncn'
            },
        ]
    }
}
