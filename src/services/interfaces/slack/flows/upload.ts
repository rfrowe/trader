import {App} from "@slack/bolt";
import {Config} from "../config";
import {error} from "../../../../utils";
import {File} from "@slack/web-api/dist/response/FilesUploadResponse";

const Upload = {
    async imageToChannel(app: App, config: Config, contents: Buffer, filename: string): Promise<void> {
        const responses = await app.client.files.uploadV2({
            channel_id: config.CHANNEL_ID,
            file: contents,
            filename,
            // token: SlackBot.USER_TOKEN_KEY
        })

        if (!responses.ok) {
            error(`uploading images: ${responses.error}`)
        }

        const files = responses.files as {
            ok: boolean,
            file: File,
        }[]
        if (files.length != 1) {
            error(`uploading images: received ${files.length} file(s) in response, expected 1`)
        }

        const response = files[0]
        if (!response.ok) {
            error('uploading image')
        }
    }
}

export default Upload
