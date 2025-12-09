import env from "env-var"

export const username = env.get("username").required().asString()
export const password = env.get("password").required().asString()
export const bucket = env.get("bucket").required().asString()
