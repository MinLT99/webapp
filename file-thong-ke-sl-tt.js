const { shell, ipcRenderer } = require('electron');
console.log("Bắt đầu chạy code");
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteerExtra.use(StealthPlugin());
// const username = '100072400811145';
// const password = '2404100082palrr';

//hàm kiểm tra

// const listProfile = [
//   "https://www.facebook.com/profile.php?id=100013033890023,Lê Thị Hồng,C1",
//   "https://www.facebook.com/profile.php?id=100058373949348,NSND Trần Dần Troll Dân Chủ Cuội,C1",
//   "https://www.facebook.com/profile.php?id=100009496400144,Nguyễn Thanh,C1",
//   "https://www.facebook.com/chulinh.chi.9,Nguyễn Hồng Giang,C2",
//   "https://www.facebook.com/profile.php?id=100072400811145,Nguyễn Phước Huệ,C2",
//   "https://www.facebook.com/profile.php?id=100085217756820,Trần Doãn Tuấn,C2",
//   "https://www.facebook.com/profile.php?id=61556585981720,Bùi Trọng Thiên,C2",
//   "https://www.facebook.com/profile.php?id=100027995328177,Nguyễn Hoàng Minh,C2",
//   "https://www.facebook.com/profile.php?id=61556631662238,Trần Minh Luận,C2",
//   "https://www.facebook.com/profile.php?id=100004395905309,Trần Đức Anh,C2",
//   "https://www.facebook.com/profile.php?id=61556681122620,Trần Văn Hưng,C2",
//   "https://www.facebook.com/profile.php?id=100064013104396,Hội Nông dân Cần Giờ,C3",
//   "https://www.facebook.com/profile.php?id=100055712153511,Vu Huynh,C3",
//   "https://www.facebook.com/profile.php?id=100047437296800,Nguyễn Hiếu,C3",
// ]
const reaction_data = fs.readFileSync("./app/listProfile.txt", "utf8");
const reaction_url_list = reaction_data
    .trim()
    .split("\n")
    .map((el) => el.trim());

let resultAll = '';
function getData() {
    (async () => {
        console.log("Bắt đầu khởi tạo trình duyệt");
        const browser = await puppeteerExtra.launch({
            headless: false,
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

                                function check(user_info_list, reaction_url_list) {
                                    let user_map = new Map();
                                    let user_url_list = [];

                                    user_info_list.map((el) => {
                                        let [url, fullname, donvi] = el.trim().split(",");
                                        user_map.set(url, { fullname, donvi, counter: 0 });
                                        user_url_list.push(url);
                                    });

                                    reaction_url_list.forEach((url) => {
                                        if (user_url_list.includes(url)) {
                                            user_map.get(url).counter += 1;
                                        }
                                    });

                                    let not_reactive_user = Array.from(user_map.entries())
                                        .filter(([key, value]) => value.counter == 0)
                                        .map(([key, value]) => `[${value.donvi}] ${value.fullname} (${key})}`);

                                    let donvi = {};

                                    Array.from(user_map.entries()).map(([key, value]) => {
                                        if (!Object.keys(donvi).includes(value.donvi)) {
                                            donvi[value.donvi] = 0;
                                        }

                                        donvi[value.donvi] += value.counter;
                                    });

                                    return { khongtuongtac: not_reactive_user, thongke: donvi };
                                }

                                // Giả sử listProfile và combinedUrls đã được định nghĩa ở đâu đó trong mã nguồn của bạn
                                let result = check(reaction_url_list, combinedUrls);

                                let textArea = document.getElementById("webDataDisplay");

                                // Format danh sách người không tương tác
                                resultAll += "Người không tương tác:\n";
                                result.khongtuongtac.forEach((item, index) => {
                                    resultAll += `${index + 1}: ${item}\n`;
                                });
                                // Format thống kê đơn vị
                                resultAll += "\nThống kê đơn vị:\n";
                                for (let key in result.thongke) {
                                    resultAll += `${key}: ${result.thongke[key]}\n`;
                                }

                                textArea.value = resultAll;
                            }
                        }
                    }
                }
                await page.waitForTimeout(1000);
            } catch (error) {
                console.error(`Lỗi khi xử lý link ${link}:`, error);
            }
        }
        await page.waitForTimeout(50000);
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
// function exportToFile() {
//   // Lấy nội dung từ textarea
//   var textareaContent = document.getElementById('webDataDisplay').value;
//   // Tạo đối tượng Blob từ nội dung
//   var blob = new Blob([textareaContent], { type: 'text/plain' });
//   // Tạo đường dẫn URL cho Blob
//   var url = window.URL.createObjectURL(blob);
//   // Tạo một thẻ a để tạo và tải xuống file
//   var a = document.createElement('a');
//   a.href = url;
//   a.download = 'Kiểm tra tương tác.txt';
//   // Thêm thẻ a vào DOM và kích hoạt sự kiện nhấp để tải xuống
//   document.body.appendChild(a);
//   a.click();
//   // Loại bỏ thẻ a khỏi DOM sau khi tải xuống
//   document.body.removeChild(a);
// }
//gọi hàm xuất kết quả tương tác
// const exportSelect = document.getElementById("exportSelect");
// const exportDataButton = document.getElementById("exportDataButton");
// Xử lý sự kiện khi người dùng click vào nút "Xuất File"
// exportDataButton.onclick = function () {
//   const selectedOption = exportSelect.value;

//   // Kiểm tra lựa chọn của người dùng và thực hiện hành động tương ứng
//   if (selectedOption === "chuaXem") {
//     exportToFile();
//   } else if (selectedOption === "binhLuan") {
//     exportToFileCmt();
//   } else {
//     console.log("Không có chức năng được chọn");
//   }
// }
//tải file người dùng lên
const upload = document.querySelector('.custom-file-upload');
upload.addEventListener('click', () => {
    document.getElementById('dataFile').click();
})