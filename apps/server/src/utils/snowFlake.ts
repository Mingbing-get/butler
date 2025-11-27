import dotEnv from 'dotenv'

dotEnv.config()

class SnowFlake {
  static MAX_SEQUENCE_AND = 255

  private workerId: number
  private startTimestamp: number
  private lastTimeStamp = -1
  private sequence = 0

  constructor(workerId: number, startTimestamp: number) {
    if (workerId < 0 || workerId > 32) {
      throw new Error('机器ID只能在0-31之间（包含0和31）')
    }

    if (startTimestamp >= Date.now()) {
      throw new Error('开始时间必须小于当前时间')
    }

    this.workerId = workerId
    this.startTimestamp = startTimestamp
  }

  next() {
    let timestamp = Date.now()

    if (timestamp < this.lastTimeStamp) {
      timestamp = this.waitToAfterLastTime()
      this.sequence = 0
    } else if (timestamp === this.lastTimeStamp) {
      this.sequence = (this.sequence + 1) & SnowFlake.MAX_SEQUENCE_AND

      if (this.sequence === 0) {
        timestamp = this.waitToAfterLastTime()
      }
    } else {
      this.sequence = 0
    }

    this.lastTimeStamp = timestamp

    return Number((BigInt(timestamp - this.startTimestamp) << BigInt(13)) | (BigInt(this.workerId) << BigInt(8)) | BigInt(this.sequence))
  }

  private waitToAfterLastTime() {
    let timestamp = Date.now()

    while (timestamp <= this.lastTimeStamp) {
      timestamp = Date.now()
    }

    return timestamp
  }
}

export default new SnowFlake(Number(process.env.WORKER_ID), new Date(process.env.START_TIME || '').getTime())
