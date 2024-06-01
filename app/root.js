const { shell, ipcRenderer } = require('electron');
console.log("Bắt đầu chạy code");
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteerExtra.use(StealthPlugin());
// const username = '100089327353144';
// const password = 'kKIfcuq68';

//hàm kiểm tra

const listProfile = [
  "https://www.facebook.com/chulinh.chi.9,Nguyễn Hồng Giang,Cụm 22",
  "https://www.facebook.com/profile.php?id=61556243115051,Nguyễn Thị Nga,Cụm 22",
  "https://www.facebook.com/profile.php?id=100085217756820,Trần Doãn Tuấn,Cụm 22",
  "https://www.facebook.com/profile.php?id=61556585981720,Bùi Trọng Thiên,Cụm 22",
  "https://www.facebook.com/profile.php?id=100027995328177,Nguyễn Hoàng Minh,Cụm 22",
  "https://www.facebook.com/profile.php?id=61556631662238,Trần Minh Luận,Cụm 22",
  "https://www.facebook.com/profile.php?id=100004395905309,Trần Đức Anh,Cụm 22",
  "https://www.facebook.com/profile.php?id=61556681122620,Trần Văn Hưng,Cụm 22",
  "https://www.facebook.com/profile.php?id=100013033890023,Lê Thị Hồng,Cụm 21",
  "https://www.facebook.com/profile.php?id=100058373949348,NSND Trần Dần Troll Dân Chủ Cuội,Cụm 21",
  "https://www.facebook.com/profile.php?id=100009496400144,Nguyễn Thanh,Cụm 21",
  "https://www.facebook.com/profile.php?id=100064013104396,Hội Nông dân Cần Giờ,Cụm 23",
  "https://www.facebook.com/profile.php?id=100055712153511,Vu Huynh,Cụm 23",
  "https://www.facebook.com/profile.php?id=100047437296800,Nguyễn Hiếu,Cụm 23",
]
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

        await page.waitForTimeout(5000);
        console.log("Đợi 5 giây trước khi tìm kiếm phần tử");

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

            try {
              await page.evaluate(() => {
                let btn_list = Array.from(document.querySelectorAll('div[role="button"] span span[dir="auto"]')).filter(el => el.innerText.includes("Xem thêm"));
                if (btn_list.length > 0) {
                  btn_list[0].click();
                }
              });
            } catch (err) {
              console.log(err);
            } finally {
              await page.waitForTimeout(5000);

              let urlCmt = await page.$$eval('div div span a[aria-hidden="false"]', el_list => {
                return el_list.map(link => link.href.replace(/[\?&]comment_id.*/, ''));
              });
              console.log(urlCmt);

              const button = await page.evaluateHandle(() => {
                const elements = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.innerText.includes("Tất cả cảm xúc:"));
                if (elements.length > 0) {
                  return elements[0];
                }
                return null;
              });

              if (button) {
                button.click();
                await page.waitForTimeout(1000);

                let hasMoreData = true;
                let old_length = 0;
                // Cuộn trang để tải thêm dữ liệu
                while (hasMoreData) {
                  let el_list = await page.$$('div[role="dialog"][aria-labelledby] span[dir="auto"] a[role="link"]');

                  if (old_length === el_list.length) {
                    hasMoreData = false;
                  } else {
                    old_length = el_list.length;
                    el_list[el_list.length - 1].scrollIntoView();

                    function getRandomIntInclusive(min, max) {
                      min = Math.ceil(min);
                      max = Math.floor(max);
                      return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
                    }

                    await page.waitForTimeout(getRandomIntInclusive(2, 5) * 1000);
                  }
                }

                // Trích xuất dữ liệu từ trang hiện tại
                let urlFB = await page.$$eval('div[role="dialog"][aria-labelledby] span[dir="auto"] a[role="link"]', el_list => {
                  return el_list.map(link => link.href.split(/.__cft/)[0]);
                });

                let combinedUrls = [...urlCmt, ...urlFB];

                // Hàm đọc người dùng từ file và chuyển thành mảng
                function readUsersFromFile(file) {
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = function (e) {
                      const fileContent = e.target.result;
                      const dataArray = fileContent.split('\n').map(line => line.split(',')).map(data => [data[0], { "hoten": data[1], "donvi": data[2] }]);
                      let dataMap = new Map(dataArray);
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
                    let fileResults = Array.from(dataMap.keys());
                    const differentUsersInFile = fileResults.filter(user => {
                      return !array1.includes(user);
                    });

                    // Hiển thị kết quả trong textarea
                    let resultAll = `=================================================\n* Danh sách người dùng chưa tương tác bài viết:\n`;
                    const customObject = {
                      "Cụm 21": 11,
                      "Cụm 22": 17,
                      "Cụm 23": 12,
                    };
                    let slCum21 = 0;
                    let slCum22 = 0;
                    let slCum23 = 0;

                    for (const user of differentUsersInFile) {
                      const donvi = dataMap.get(user)["donvi"].trim();
                      const hoten = dataMap.get(user)["hoten"].trim();
                      const facebook = user;
                      if (donvi === "Cụm 21") {
                        slCum21++;
                      } else if (donvi === "Cụm 22") {
                        slCum22++;
                      } else if (donvi === "Cụm 23") {
                        slCum23++;
                      }
                      resultAll += `${donvi} - ${hoten} (Facebook: ${facebook})\n`;
                    }

                    // Số lượng người tương tác của các cụm
                    if (slCum21 > 0) {
                      customObject["Cụm 21"] -= slCum21;
                    }
                    if (slCum22 > 0) {
                      customObject["Cụm 22"] -= slCum22;
                    }
                    if (slCum23 > 0) {
                      customObject["Cụm 23"] -= slCum23;
                    }

                    for (const unit in customObject) {
                      resultAll += `* Số lượng người tương tác của cụm ${unit}: ${customObject[unit]}\n`;
                    }

                    document.getElementById("webDataDisplay").value = resultAll;
                  } catch (error) {
                    console.error('Đã xảy ra lỗi khi đọc file:', error);
                  }
                }

                async function performComparison() {
                  try {
                    const webResults = combinedUrls;
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

                performComparison();
              }
            }
          }
        }
        await page.waitForTimeout(1000);
      } catch (error) {
        console.error(`Lỗi khi xử lý link ${link}:`, error);
      }
    }
    await page.waitForTimeout(5000);
    await browser.close();
    console.log("Trình duyệt đã đóng");
  })();
}

//gọi hàm kiểm tra tương tác
document.getElementById('btnEd').addEventListener('click', () => {
  resultAll += "Đang chạy khởi chạy tính năng kiểm tra tương tác \n";
  document.getElementById("webDataDisplay").value = resultAll;
  getData();
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