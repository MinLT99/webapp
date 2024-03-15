const { shell, ipcRenderer } = require('electron');

console.log("Bắt đầu chạy code");
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteerExtra.use(StealthPlugin());

// const username = '100089327353144';
// const password = 'kKIfcuq68';

//hàm kiểm tra
let resultAll = '';
function getData() {
  (async () => {
    console.log("Bắt đầu khởi tạo trình duyệt");
    const browser = await puppeteerExtra.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--enable-webgl',
        '--window-size=800,800',
        '--disable-notifications',
      ],
      userDataDir: './userData',
    });
    console.log("Khởi tạo trình duyệt thành công");

    console.log("Tạo mới trang");
    const page = await browser.newPage();
    console.log("Trang mới được tạo");

    // Lấy giá trị từ ô textarea
    var linkText = document.getElementById('linkfb').value;

    // Tách các đường link bằng dấu xuống dòng
    var links = linkText.split('\n');

    await page.goto("https://www.facebook.com", { waitUntil: 'networkidle2' });

    // console.log("Nhập tên đăng nhập và mật khẩu");
    // await page.type('form input[type="text"]', username, { delay: 100 });
    // await page.type('form input[type="password"][name="pass"]', password, { delay: 100 });
    // await page.keyboard.press('Enter');

    await page.waitForTimeout(2000);
    for (const link of links) {
      try {
        // Mở trang
        await page.goto(link, { waitUntil: 'networkidle2' });

        console.log("Đợi 5 giây trước khi tìm kiếm phần tử");
        await page.waitForTimeout(5000);

        //hàm evaluateHandle trả về 1 phần tử
        const button = await page.evaluateHandle(() => {
          const elements = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.innerText.includes("Tất cả cảm xúc:"));

          if (elements.length > 0) {
            return elements[0]
          }
          return null;
        });

        if (button) {
          console.log("Thực hiện phương thức click");
          button.click();

          console.log("Đợi 1 giây để load các element");
          await page.waitForTimeout(1000);

          // let extractedUserData = [];
          let hasMoreData = true;
          let old_length = 0;

          //cuộn trang
          for (let pageCounter = 0; hasMoreData; pageCounter++) {
            // Thực hiện cuộn trang bằng Puppeteer hoặc một cách khác tùy thuộc vào môi trường của bạn
            let el_list = await page.$$('div[role="dialog"][aria-labelledby] span[dir="auto"] a[role="link"]');

            if (old_length === el_list.length) {
              break;
            }

            old_length = el_list.length
            el_list[el_list.length - 1].scrollIntoView()

            function getRandomIntInclusive(min, max) {
              min = Math.ceil(min);
              max = Math.floor(max);
              return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
            }

            await page.waitForTimeout(getRandomIntInclusive(2, 5) * 1000);
          }

          // Trích xuất dữ liệu từ trang hiện tại bằng Puppeteer hoặc cách khác tùy thuộc vào môi trường của bạn
          let urlFB = await page.$$eval('div[role="dialog"][aria-labelledby] span[dir="auto"] a[role="link"]', el_list => {
            return el_list.map(link => link.href.split(/.__cft/)[0]);
          });
          console.log(urlFB);
          // Hàm đọc người dùng từ file và chuyển thành mảng
          function readUsersFromFile(file) {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = function (e) {
                const fileContent = e.target.result;
                const dataArray = fileContent.split('\n').map(line => line.split(',')).map(data => [data[0], { "hoten": data[1], "donvi": data[2] }])
                let dataMap = new Map(dataArray)
                resolve(dataMap);
              };

              reader.onerror = function (e) {
                reject(e);
              };

              reader.readAsText(file);
            });
          }

          // Hàm so sánh hai mảng
          async function compareArrays(array1, array2) {
            try {
              const dataMap = await readUsersFromFile(array2);
              console.log(dataMap)
              let fileResults = dataMap.keys()
              const differentUsersInFile = fileResults.filter(user => {
                return !array1.includes(user);
              });

              // Hiển thị kết quả trong textarea
              resultAll +=
                `=================================================
* Danh sách người dùng chưa tương tác: ${link}
`;

              for (const user of differentUsersInFile) {
                resultAll += `${dataMap.get(user)["donvi"].trim()} - ${dataMap.get(user)["hoten"].trim()} (Facebook: ${user})\n`;
              }

              document.getElementById("webDataDisplay").value = resultAll;
            } catch (error) {
              console.error('Đã xảy ra lỗi khi đọc file:', error);
            }
          }

          async function performComparison() {
            try {
              const webResults = urlFB;
              const fileInput = document.getElementById('dataFile');

              // Kiểm tra xem người dùng đã chọn file hay chưa
              if (fileInput.files.length > 0) {
                await compareArrays(webResults, fileInput.files[0]);
              } else {
                console.error('Không có tệp tin được chọn.');
              }
            } catch (error) {
              console.error('Đã xảy ra lỗi:', error);
            }
          }

          // Chạy hàm so sánh
          performComparison();
        }

        //lấy cmt


        await page.waitForTimeout(1000);
        console.log("Đợi 1s để load link khác");
      } catch (error) {
        console.error(`Lỗi khi xử lý link ${link}:`, error);
      }
    }

    await page.waitForTimeout(50000);
    console.log("Đợi 5 giây trước khi đóng trình duyệt");

    await browser.close();
    console.log("Trình duyệt đã đóng");
  })();
}

//gọi hàm kiểm tra
document.getElementById('btnEd').addEventListener('click', () => {
  resultAll += "Đang chạy khởi chạy tính năng kiểm tra tương tác \n";
  document.getElementById("webDataDisplay").value = resultAll;
  getData();
});

let resultCmt = '';
function getCmt() {
  (async () => {
    console.log("Bắt đầu khởi tạo trình duyệt");
    const browser = await puppeteerExtra.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--enable-webgl',
        '--window-size=800,800',
        '--disable-notifications'
      ],
      userDataDir: './userData',
    });
    console.log("Khởi tạo trình duyệt thành công");

    console.log("Tạo mới trang");
    const page = await browser.newPage();
    console.log("Trang mới được tạo");

    // Lấy giá trị từ ô textarea
    var linkText = document.getElementById('linkfb').value;

    // Tách các đường link bằng dấu xuống dòng
    var links = linkText.split('\n');

    await page.goto("https://www.facebook.com", { waitUntil: 'networkidle2' });

    await page.waitForTimeout(5000);
    for (const link of links) {
      try {
        // Mở trang
        await page.goto(link, { waitUntil: 'networkidle2' });

        console.log(`Đã chạy link: ${link}`);

        console.log("Đợi 5 giây trước khi tìm kiếm phần tử cmt");
        await page.waitForTimeout(5000);

        //Chọn tất cả các cmt
        const phuHopNhat = await page.evaluateHandle(() => {
          const showAll1 = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.innerText.includes("Phù hợp nhất"));
          if (showAll1.length > 0) {
            return showAll1[0]
          }
          return null;
        });

        if (phuHopNhat) {
          phuHopNhat.click()
          console.log("Thực hiện phương thức click PHÙ HỢP NHẤT");

          console.log("Đợi 1 giây để load các element");
          await page.waitForTimeout(1000);

          const tatCaCmt = await page.evaluateHandle(() => {
            const showAll2 = Array.from(document.querySelectorAll('div[aria-hidden="false"] div[role="menuitem"] span')).filter(el => el.innerText.includes("Tất cả bình luận"));
            if (showAll2.length > 0) {
              return showAll2[0]
            }
            return null;
          });

          if (tatCaCmt) {
            tatCaCmt.click();
            console.log("Thực hiện phương thức click TẤT CẢ CMT");

            await page.waitForTimeout(2000);
            console.log("Đợi 2s để load cmt");

            try {
              await page.evaluate(() => {
                let btn_list = Array.from(document.querySelectorAll('div[role="button"] span span[dir="auto"]')).filter(el => el.innerText.includes("Xem thêm"));
                if (btn_list.length > 0) {
                  btn_list[0].click()
                }
              });
            } catch (err) {
              console.log(err)
            } finally {
              // Thêm bất kỳ hành động nào khác sau khi click
              await page.waitForTimeout(5000);
              let comments = await page.$$eval('div[aria-label*="Bình luận dưới tên"]', commentElements => {
                return commentElements.map(commentElement => {
                  const userElement = commentElement.querySelector('span a[aria-hidden="false"]');
                  const commentTextElement = commentElement.querySelector('span[dir="auto"][lang]');

                  // Kiểm tra xem commentTextElement có tồn tại và có nội dung không trống không
                  if (commentTextElement && commentTextElement.textContent.trim() !== '') {
                    const user = userElement ? userElement.textContent : 'Unknown User';
                    const comment = commentTextElement.textContent.trim();
                    return { user, comment };
                  }
                }).filter(Boolean);
              });
              const nonEmptyComments = comments.filter(item => item.comment);

              console.log(nonEmptyComments);
              // Hiển thị kết quả trong textarea
              resultCmt +=
                `=================================================
* Người dùng và nội dung bình luận: ${link}\n
`;
              nonEmptyComments.forEach(comment => {
                resultCmt += `User: ${comment.user}\nComment: ${comment.comment}\n\n`;
              });

              // Gán giá trị của chuỗi vào textarea
              document.getElementById("webDataDisplayCMT").value = resultCmt;
            }

            console.log("Đợi 1s để lấy dữ liệu chia sẻ")
            await page.waitForTimeout(1000);
          }
        }
        await page.waitForTimeout(1000);
        console.log("Đợi 1s để load link khác");
      } catch (error) {
        console.error(`Lỗi khi xử lý link ${link}:`, error);
      }
    }

    await page.waitForTimeout(5000);
    console.log("Đợi 5 giây trước khi đóng trình duyệt");

    await browser.close();
    console.log("Trình duyệt đã đóng");
  })();
}

//gọi hàm kiểm tra
document.getElementById('btnCmt').addEventListener('click', () => {
  resultCmt += "Đang chạy khởi chạy tính năng thu thập bình luận \n";
  document.getElementById("webDataDisplayCMT").value = resultCmt;
  getCmt();
});

//xuất kết quả ra file tương tác
function exportToFile() {
  // Lấy nội dung từ textarea
  var textareaContent = document.getElementById('webDataDisplay').value;

  // Tạo đối tượng Blob từ nội dung
  var blob = new Blob([textareaContent], { type: 'text/plain' });

  // Tạo đường dẫn URL cho Blob
  var url = window.URL.createObjectURL(blob);

  // Tạo một thẻ a để tạo và tải xuống file
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Kiểm tra tương tác.txt';

  // Thêm thẻ a vào DOM và kích hoạt sự kiện nhấp để tải xuống
  document.body.appendChild(a);
  a.click();

  // Loại bỏ thẻ a khỏi DOM sau khi tải xuống
  document.body.removeChild(a);
}
//xuất kết quả ra file bình luận
function exportToFileCmt() {
  // Lấy nội dung từ textarea
  var textareaContent = document.getElementById('webDataDisplayCMT').value;

  // Tạo đối tượng Blob từ nội dung
  var blob = new Blob([textareaContent], { type: 'text/plain' });

  // Tạo đường dẫn URL cho Blob
  var url = window.URL.createObjectURL(blob);

  // Tạo một thẻ a để tạo và tải xuống file
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Nội dung bình luận.txt';

  // Thêm thẻ a vào DOM và kích hoạt sự kiện nhấp để tải xuống
  document.body.appendChild(a);
  a.click();

  // Loại bỏ thẻ a khỏi DOM sau khi tải xuống
  document.body.removeChild(a);
}

//gọi hàm xuất kết quả tương tác
const exportSelect = document.getElementById("exportSelect");
const exportDataButton = document.getElementById("exportDataButton");

// Xử lý sự kiện khi người dùng click vào nút "Xuất File"
exportDataButton.onclick = function () {
  const selectedOption = exportSelect.value;

  // Kiểm tra lựa chọn của người dùng và thực hiện hành động tương ứng
  if (selectedOption === "chuaXem") {
    exportToFile();
  } else if (selectedOption === "binhLuan") {
    exportToFileCmt();
  } else {
    console.log("Không có chức năng được chọn");
  }
}


//tải file người dùng lên
const upload = document.querySelector('.custom-file-upload');
upload.addEventListener('click', () => {
  document.getElementById('dataFile').click();
})