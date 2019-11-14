import chalk from 'chalk'

/**
 * export log function
 * @param content
 * @param success
 */
export default function (content:string, success?:boolean):void {
    if (typeof success === "boolean") {
        if (success) {
            console.log(chalk.green(content))
        } else {
            console.log(chalk.red(content))
        }
    } else {
        console.log(
            content.replace(
                /\d+/g,
                (number) => {
                    return chalk.magentaBright(number)
                }
            )
        )
    }
}
