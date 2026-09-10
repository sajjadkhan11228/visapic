"use client";

export default function AdsterraBanner() {
  const adCode = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=300,height=250" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 300px;
            height: 250px;
            overflow: hidden;
            background: transparent;
          }
        </style>
      </head>
      <body>
        <script>
          var atOptions = {
            'key': '14961df5a90435a2d455a8b391ae9866',
            'format': 'iframe',
            'height': 250,
            'width': 300,
            'params': {}
          };
        </script>

        <script src="https://www.highrevenueformat.com/14961df5a90435a2d455a8b391ae9866/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="flex justify-center py-8">
      <iframe
        title="Advertisement"
        srcDoc={adCode}
        width="300"
        height="250"
        style={{
          border: "0",
          display: "block",
          overflow: "hidden",
        }}
        loading="lazy"
      />
    </div>
  );
}