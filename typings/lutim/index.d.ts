export = lutim
declare global {
  namespace lutim {
    function setApiUrl(url: object)

    function getApiUrl(): string

    function getServerInfos(): Promise<any>

    function uploadImage(filePath: string, deleteDay?: number, firstView?: number, keepExif?: number, crypt?: number): Promise<any>

    function deleteImage(realShort: String, token: String): Promise<any>

    function modifyImage(realShort: String, token: String, deleteDay: number, firstView?: number): Promise<any>

    function getImage(short: String): Promise<any>

    function getImageInfos(real_short: String): Promise<any>

    function getImageCountAndStatus(short: String, token: String): Promise<any>

  }
}

