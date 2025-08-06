import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }
  
  // 解码文件名
  const decodedFilename = decodeURIComponent(filename)
  
  // 构建文件路径
  const filePath = path.join(process.cwd(), '发票111', decodedFilename)
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }
  
  // 检查文件扩展名
  if (!decodedFilename.toLowerCase().endsWith('.pdf')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only PDF files are allowed'
    })
  }
  
  try {
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath)
    
    // 设置响应头
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Length', fileBuffer.length.toString())
    setHeader(event, 'Content-Disposition', `inline; filename="${decodedFilename}"`
    
    return fileBuffer
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error reading file'
    })
  }
})