import React from "react"

function ProjectManageButtons() {
  return (
    // สำหรับฟรีแลนซ์กดรับหรือปฏิเสธคำขอจากเจ้าของโปรเจกต์
    <div className="flex gap-3">
      <button className="btn-primary">
        ยอมรับ
      </button>
      <button className="btn-danger">
        ปฏิเสธ
      </button>
    </div>

    // สำหรับฟรีแลนซ์กดยกเลิกคำขอหลังจากส่งคำขอไป
    // <div className="flex gap-3">
    //   <button className="btn-secondary">
    //     ยกเลิกคำขอ
    //   </button>
    // </div>


    // สำหรับฟรีแลนซ์กดเสร็จงานเมื่อ progress ของงานถึง 100% ถ้ายังไม่ถึง ปุ่มเสร็จงานจะ disabled
    //และฟรีแสนซ์สามารถกดส่งข้อความถึงเจ้าของโปรเจกต์ได้ขณะที่งานกำลังดำเนินการหรือกำลังแก้ไข
    // <div className="flex gap-3">
    //   <button className="btn-primary">
    //     เสร็จสิ้น
    //   </button>
    //   <button className="btn-secondary">
    //     ส่งข้อความ
    //   </button>
    // </div>

    // สำหรับฟรีแลนซ์กดเสร็จงานเมื่อ progress ของงานถึง 100% ถ้ายังไม่ถึง ปุ่มเสร็จงานจะ disabled
    //และฟรีแสนซ์สามารถกดส่งข้อความถึงเจ้าของโปรเจกต์ได้ขณะที่งานกำลังดำเนินการหรือกำลังแก้ไข
    // <div className="flex gap-3">
    //   <button className="btn-primary">
    //     แก้ไขเสร็จสิ้น
    //   </button>
    //   <button className="btn-secondary">
    //     ส่งข้อความ
    //   </button>
    // </div>

    // สำหรับเจ้าของโปรเจกต์กดยกเลิกคำขอหลังจากส่งคำขอไป
    // <div className="flex gap-3">
    //   <button className="btn-secondary">
    //     ยกเลิกคำขอ
    //   </button>
    // </div>

    // สำหรับเจ้าของโปรเจกต์กดรับหรือปฏิเสธคำขอจากฟรีแลนซ์
    // <div className="flex gap-3">
    //   <button className="btn-primary">
    //     ยอมรับ
    //   </button>
    //   <button className="btn-danger">
    //     ปฏิเสธ
    //   </button>
    // </div>

    // สำหรับเจ้าของโปรเจกต์กดส่งข้อความถึงฟรีแลนซ์เมื่องานกำลังดำเนินการ หรือกำลังแก้ไข
    // <div className="flex gap-3">
    //   <button className="btn-secondary">
    //     ส่งข้อความ
    //   </button>
    // </div>

    // สำหรับเจ้าของโปรเจกต์กดยืนยันงานเสร็จหรือให้แก้ไขงานหลังจากฟรีแลนซ์กดเสร็จสิ้นหรือแก้ไขเสร็จสิ้น
    // <div className="flex gap-3">
    //   <button className="btn-primary">
    //     ยืนยันงานเสร็จ
    //   </button>
    //   <button className="btn-danger">
    //     ต้องแก้ไข
    //   </button>
    // </div>


    //เมื่องานมีสถานะเสร็จสิ้น คอมโพเนนต์นี้จะไม่แสดง
  )
}
export default ProjectManageButtons