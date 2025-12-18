import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Stack Ghost API',
    description: 'Auto generated documentation',
  },
  host: 'localhost:3000', // غير البورت لو مختلف
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./server.js']; // الملف الرئيسي اللي مجمع فيه الـ routes

/* ملاحظة: لو انت مقسم الـ routes في ملفات routes منفصلة ومستدعيها في app.js 
   هو هيدخل يقرأها لوحده، بس تأكد إن app.js هو نقطة البداية */

swaggerAutogen(outputFile, endpointsFiles, doc);